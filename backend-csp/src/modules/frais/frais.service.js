import prisma from '../../config/database.js';
import { isYearArchived } from '../academic-years/academicYears.service.js';

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
  if (await isYearArchived(schoolId, anneeScolaire)) {
    throw Object.assign(new Error('Cette année scolaire est archivée — modification impossible'), { status: 403 });
  }
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
  const existing = await prisma.fraisScolaire.findFirst({ where: { id, schoolId } });
  if (existing && await isYearArchived(schoolId, existing.anneeScolaire)) {
    throw Object.assign(new Error('Cette année scolaire est archivée — suppression impossible'), { status: 403 });
  }
  return await prisma.fraisScolaire.deleteMany({ where: { id, schoolId } });
};