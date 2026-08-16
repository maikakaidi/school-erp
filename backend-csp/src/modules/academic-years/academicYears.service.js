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

export const createYear = async (schoolId, { name, startDate, endDate }) => {
  const existing = await prisma.academicYear.findUnique({
    where: { schoolId_name: { schoolId, name } },
  });
  if (existing) throw Object.assign(new Error('Cette année scolaire existe déjà'), { status: 409 });

  // Si c'est la première année, la définir comme courante
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
