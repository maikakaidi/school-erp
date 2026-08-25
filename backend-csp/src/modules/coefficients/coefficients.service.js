import prisma from '../../config/database.js';
import { isYearArchived } from '../academic-years/academicYears.service.js';

export const getAllCoefficients = async (schoolId, anneeScolaire) => {
  return await prisma.coefficient.findMany({
    where: { schoolId, anneeScolaire, matiere: { isActive: true } },
    include: { classe: true, matiere: true },
    orderBy: { classe: { nom: 'asc' } },
  });
};

export const getCoefficientsByClasse = async (schoolId, classeId, anneeScolaire) => {
  return await prisma.coefficient.findMany({
    where: { schoolId, classeId, anneeScolaire, matiere: { isActive: true } },
    include: { matiere: true },
  });
};

export const upsertCoefficient = async (schoolId, data) => {
  const { classeId, matiereId, anneeScolaire, coefficient } = data;
  if (await isYearArchived(schoolId, anneeScolaire)) {
    throw Object.assign(new Error('Cette année scolaire est archivée — modification impossible'), { status: 403 });
  }
  return await prisma.coefficient.upsert({
    where: {
      classeId_matiereId_anneeScolaire: { classeId, matiereId, anneeScolaire },
    },
    update: { coefficient },
    create: { schoolId, classeId, matiereId, anneeScolaire, coefficient },
  });
};

// « — » : la matière n'est pas enseignée dans cette classe.
// Représentation canonique = ligne Coefficient absente => deleteMany idempotent.
export const clearCoefficient = async (schoolId, data) => {
  const { classeId, matiereId, anneeScolaire } = data;
  if (await isYearArchived(schoolId, anneeScolaire)) {
    throw Object.assign(new Error('Cette année scolaire est archivée — modification impossible'), { status: 403 });
  }
  return await prisma.coefficient.deleteMany({
    where: { schoolId, classeId, matiereId, anneeScolaire },
  });
};

export const deleteCoefficient = async (id, schoolId) => {
  const coeff = await prisma.coefficient.findFirst({ where: { id, schoolId } });
  if (!coeff) throw Object.assign(new Error('Coefficient introuvable'), { status: 404 });
  if (await isYearArchived(schoolId, coeff.anneeScolaire)) {
    throw Object.assign(new Error('Cette année scolaire est archivée — suppression impossible'), { status: 403 });
  }
  return await prisma.coefficient.deleteMany({ where: { id, schoolId } });
};