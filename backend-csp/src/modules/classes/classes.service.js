import prisma from '../../config/database.js';

function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export const getAllClasses = async (
  schoolId,
  anneeScolaire
) => {

  // Si aucune année fournie, récupérer l'année courante de l'école
  if (!anneeScolaire) {
    const current = await prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      select: { name: true },
    });
    if (current) {
      anneeScolaire = current.name;
    } else {
      // Fallback: année la plus récente
      const latest = await prisma.academicYear.findFirst({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
        select: { name: true },
      });
      if (latest) {
        anneeScolaire = latest.name;
      }
    }
  }

  const where = {
    schoolId,
    isActive: true,
  };

  if (anneeScolaire) {
    where.anneeScolaire = anneeScolaire;
  }

  let all = await prisma.classe.findMany({
    where,
    include: {
      inscriptions: {
        include: {
          eleve: true,
        },
      },
    },
    orderBy: [
      { niveau: 'asc' },
      { nom: 'asc' },
    ],
  });

  // Fallback: si aucun résultat avec le filtre année, retourner toutes les classes actives
  if (all.length === 0 && where.anneeScolaire) {
    delete where.anneeScolaire;
    all = await prisma.classe.findMany({
      where,
      include: {
        inscriptions: { include: { eleve: true } },
      },
      orderBy: [{ niveau: 'asc' }, { nom: 'asc' }],
    });
  }

  // Dédoublonner par nom normalisé (accents, casse)
  const seen = new Map();
  for (const c of all) {
    const key = normalize(c.nom);
    if (!seen.has(key)) {
      seen.set(key, c);
    }
  }
  return Array.from(seen.values());
};

export const getClasseById = async (id, schoolId) => {
  return await prisma.classe.findFirst({
    where: { id, schoolId },
    include: { inscriptions: { include: { eleve: true } } }
  });
};

export const createClasse = async (schoolId, data) => {
  return await prisma.classe.create({ data: { ...data, schoolId } });
};

export const updateClasse = async (id, schoolId, data) => {
  return await prisma.classe.updateMany({ where: { id, schoolId }, data });
};

export const deleteClasse = async (id, schoolId) => {
  return await prisma.classe.updateMany({ where: { id, schoolId }, data: { isActive: false } });
};