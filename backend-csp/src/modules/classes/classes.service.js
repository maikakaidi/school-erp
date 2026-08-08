import prisma from '../../config/database.js';

export const getAllClasses = async (
  schoolId,
  anneeScolaire
) => {

  const where = {
    schoolId,
    isActive: true,
  };

  // Ajouter le filtre seulement si fourni
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