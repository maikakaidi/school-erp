import prisma from '../../config/database.js';

export const getAllCoefficients = async (schoolId, anneeScolaire) => {
  return await prisma.coefficient.findMany({
    where: { schoolId, anneeScolaire, matiere: { isActive: true, groupeId: null } },
    include: { classe: true, matiere: true },
    orderBy: { classe: { nom: 'asc' } },
  });
};

export const getCoefficientsByClasse = async (schoolId, classeId, anneeScolaire) => {
  return await prisma.coefficient.findMany({
    where: { schoolId, classeId, anneeScolaire, matiere: { isActive: true, groupeId: null } },
    include: { matiere: true },
  });
};

export const upsertCoefficient = async (schoolId, data) => {
  const { classeId, matiereId, anneeScolaire, coefficient } = data;
  return await prisma.coefficient.upsert({
    where: {
      classeId_matiereId_anneeScolaire: { classeId, matiereId, anneeScolaire },
    },
    update: { coefficient },
    create: { schoolId, classeId, matiereId, anneeScolaire, coefficient },
  });
};

export const deleteCoefficient = async (id, schoolId) => {
  return await prisma.coefficient.deleteMany({ where: { id, schoolId } });
};