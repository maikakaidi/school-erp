import prisma from '../../config/database.js';

export const getAllFrais = async (schoolId, anneeScolaire) => {
  const where = { schoolId };
  if (anneeScolaire) where.anneeScolaire = anneeScolaire;
  return await prisma.fraisScolaire.findMany({
    where,
    include: { classe: true },
    orderBy: { classe: { nom: 'asc' } },
  });
};

export const getFraisByClasse = async (schoolId, classeId, anneeScolaire) => {
  return await prisma.fraisScolaire.findFirst({
    where: { schoolId, classeId, anneeScolaire },
    include: { classe: true },
  });
};

export const upsertFrais = async (schoolId, data) => {
  const { classeId, anneeScolaire, versement1, versement2, versement3 } = data;
  const total = versement1 + versement2 + versement3;
  return await prisma.fraisScolaire.upsert({
    where: {
      schoolId_classeId_anneeScolaire: {
        schoolId,
        classeId,
        anneeScolaire,
      },
    },
    update: { versement1, versement2, versement3, total },
    create: {
      schoolId,
      classeId,
      anneeScolaire,
      versement1,
      versement2,
      versement3,
      total,
    },
  });
};

export const deleteFrais = async (id, schoolId) => {
  return await prisma.fraisScolaire.deleteMany({ where: { id, schoolId } });
};