import prisma from '../../config/database.js';

export const getYears = async (schoolId) => {
  return prisma.academicYear.findMany({
    where: { schoolId },
    orderBy: [{ isCurrent: 'desc' }, { createdAt: 'desc' }],
  });
};

export const getCurrentYear = async (schoolId) => {
  const current = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
  });
  if (current) return current;
  return prisma.academicYear.findFirst({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
  });
};

export const resolveAcademicYear = async (schoolId, anneeScolaire, dateStr) => {
  if (anneeScolaire) return anneeScolaire;
  if (dateStr) {
    const target = new Date(dateStr);
    if (!isNaN(target.getTime())) {
      const year = await prisma.academicYear.findFirst({
        where: { schoolId, isArchived: false, startDate: { lte: target }, endDate: { gte: target } },
      });
      if (year) return year.name;
    }
  }
  const current = await getCurrentYear(schoolId);
  if (current) return current.name;
  throw Object.assign(new Error('Aucune année scolaire configurée. Veuillez créer une année scolaire dans les paramètres.'), { status: 400 });
};

export const createYear = async (schoolId, { name, startDate, endDate }) => {
  const existing = await prisma.academicYear.findUnique({
    where: { schoolId_name: { schoolId, name } },
  });
  if (existing) throw Object.assign(new Error('Cette année scolaire existe déjà'), { status: 409 });

  // Générer les dates par défaut à partir du nom (ex: "AAAA-BBBB" → sept AAAA - juin BBBB)
  if (!startDate || !endDate) {
    const match = name.match(/^(\d{4})-(\d{4})$/);
    if (match) {
      startDate = startDate || `${match[1]}-09-01`;
      endDate = endDate || `${match[2]}-06-30`;
    } else {
      startDate = startDate || new Date().toISOString().slice(0, 10);
      endDate = endDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
    }
  }

  const count = await prisma.academicYear.count({ where: { schoolId } });
  const isCurrent = count === 0;

  return prisma.academicYear.create({
    data: { schoolId, name, startDate: new Date(startDate), endDate: new Date(endDate), isCurrent },
  });
};

export const setCurrent = async (schoolId, yearId) => {
  const year = await prisma.academicYear.findFirst({
    where: { id: yearId, schoolId },
  });
  if (!year) throw Object.assign(new Error('Année scolaire introuvable'), { status: 404 });
  if (year.isArchived) throw Object.assign(new Error('Impossible de sélectionner une année archivée'), { status: 400 });

  // Désactive toutes les années courantes de l'école
  await prisma.academicYear.updateMany({
    where: { schoolId, isCurrent: true },
    data: { isCurrent: false },
  });
  // Active l'année demandée
  await prisma.academicYear.update({
    where: { id: yearId },
    data: { isCurrent: true },
  });
  return { id: year.id, name: year.name, isCurrent: true };
};

export const closeYear = async (schoolId, yearId) => {
  const year = await prisma.academicYear.findFirst({
    where: { id: yearId, schoolId },
  });
  if (!year) throw Object.assign(new Error('Année scolaire introuvable'), { status: 404 });
  if (year.isArchived) throw Object.assign(new Error('Année déjà archivée'), { status: 400 });

  return prisma.academicYear.update({
    where: { id: yearId },
    data: { isArchived: true, isCurrent: false },
  });
};

export const copyYearData = async (schoolId, sourceYearId, targetYearName) => {
  const sourceYear = await prisma.academicYear.findFirst({
    where: { id: sourceYearId, schoolId },
  });
  if (!sourceYear) throw Object.assign(new Error('Année source introuvable'), { status: 404 });

  // Crée ou récupère l'année cible
  let targetYear = await prisma.academicYear.findUnique({
    where: { schoolId_name: { schoolId, name: targetYearName } },
  });
  if (!targetYear) {
    targetYear = await prisma.academicYear.create({
      data: {
        schoolId,
        name: targetYearName,
        startDate: sourceYear.startDate,
        endDate: sourceYear.endDate,
        isCurrent: false,
      },
    });
  }

  // Copie les classes (nom + niveau) — ne duplique pas si déjà présentes
  const sourceClasses = await prisma.classe.findMany({
    where: { schoolId, anneeScolaire: sourceYear.name },
  });
  for (const cls of sourceClasses) {
    const existing = await prisma.classe.findFirst({
      where: { schoolId, nom: cls.nom, anneeScolaire: targetYearName },
    });
    if (!existing) {
      await prisma.classe.create({
        data: {
          schoolId,
          nom: cls.nom,
          niveau: cls.niveau,
          anneeScolaire: targetYearName,
          capacite: cls.capacite,
        },
      });
    }
  }

  // Copie les coefficients
  const sourceCoeffs = await prisma.coefficient.findMany({
    where: { schoolId, anneeScolaire: sourceYear.name },
  });
  for (const coeff of sourceCoeffs) {
    const targetClasse = await prisma.classe.findFirst({
      where: { schoolId, nom: (await prisma.classe.findUnique({ where: { id: coeff.classeId } }))?.nom, anneeScolaire: targetYearName },
    });
    const targetMatiere = await prisma.matiere.findFirst({
      where: { schoolId, id: coeff.matiereId },
    });
    if (targetClasse && targetMatiere) {
      const existing = await prisma.coefficient.findFirst({
        where: {
          classeId: targetClasse.id,
          matiereId: targetMatiere.id,
          anneeScolaire: targetYearName,
        },
      });
      if (!existing) {
        await prisma.coefficient.create({
          data: {
            schoolId,
            classeId: targetClasse.id,
            matiereId: targetMatiere.id,
            coefficient: coeff.coefficient,
            anneeScolaire: targetYearName,
          },
        });
      }
    }
  }

  // Copie les frais scolaires
  const sourceFrais = await prisma.fraisScolaire.findMany({
    where: { schoolId, anneeScolaire: sourceYear.name },
  });
  for (const frais of sourceFrais) {
    const targetClasse = await prisma.classe.findFirst({
      where: { schoolId, nom: (await prisma.classe.findUnique({ where: { id: frais.classeId } }))?.nom, anneeScolaire: targetYearName },
    });
    if (targetClasse) {
      const existing = await prisma.fraisScolaire.findFirst({
        where: {
          schoolId,
          classeId: targetClasse.id,
          anneeScolaire: targetYearName,
        },
      });
      if (!existing) {
        await prisma.fraisScolaire.create({
          data: {
            schoolId,
            classeId: targetClasse.id,
            anneeScolaire: targetYearName,
            versement1: frais.versement1,
            versement2: frais.versement2,
            versement3: frais.versement3,
            total: frais.total,
          },
        });
      }
    }
  }

  return { sourceYear: sourceYear.name, targetYear: targetYear.name };
};

export const isYearArchived = async (schoolId, anneeScolaire) => {
  if (!anneeScolaire) return false;
  const year = await prisma.academicYear.findUnique({
    where: { schoolId_name: { schoolId, name: anneeScolaire } },
  });
  return year?.isArchived || false;
};

export const updateYear = async (schoolId, yearId, { name }) => {
  const year = await prisma.academicYear.findFirst({
    where: { id: yearId, schoolId },
  });
  if (!year) throw Object.assign(new Error('Année scolaire introuvable'), { status: 404 });
  if (year.isCurrent) throw Object.assign(new Error('Impossible de modifier l\'année courante'), { status: 400 });

  if (name && name !== year.name) {
    const existing = await prisma.academicYear.findUnique({
      where: { schoolId_name: { schoolId, name } },
    });
    if (existing) throw Object.assign(new Error('Ce nom d\'année existe déjà'), { status: 409 });
  }

  return prisma.academicYear.update({
    where: { id: yearId },
    data: { name },
  });
};

export const deleteYear = async (schoolId, yearId) => {
  const year = await prisma.academicYear.findFirst({
    where: { id: yearId, schoolId },
  });
  if (!year) throw Object.assign(new Error('Année scolaire introuvable'), { status: 404 });
  if (year.isCurrent) throw Object.assign(new Error('Impossible de supprimer l\'année courante'), { status: 400 });

  // Vérifier s'il y a des données liées
  const hasClasses = await prisma.classe.count({ where: { schoolId, anneeScolaire: year.name } });
  if (hasClasses > 0) {
    throw Object.assign(new Error(`Impossible : ${hasClasses} classe(s) liée(s) à cette année. Supprimez-les d'abord.`), { status: 400 });
  }

  return prisma.academicYear.delete({
    where: { id: yearId },
  });
};
