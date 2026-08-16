import prisma from '../../config/database.js';

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
    }
  }

  const where = {
    schoolId,
    isActive: true,
  };

  if (anneeScolaire) {
    where.anneeScolaire = anneeScolaire;
  }

  return await prisma.classe.findMany({
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