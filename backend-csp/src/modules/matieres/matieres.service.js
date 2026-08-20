import prisma from '../../config/database.js';

export const getAllMatieres = async (schoolId, includeInactive = false) => {
  const where = { schoolId };
  if (!includeInactive) where.isActive = true;
  return await prisma.matiere.findMany({
    where,
    include: { groupe: true },
    orderBy: { libelle: 'asc' },
  });
};

export const getMatiereById = async (id, schoolId) => {
  return await prisma.matiere.findFirst({ where: { id, schoolId }, include: { groupe: true } });
};

export const createMatiere = async (schoolId, data) => {
  return await prisma.matiere.create({ data: { ...data, schoolId } });
};

export const updateMatiere = async (id, schoolId, data) => {
  return await prisma.matiere.updateMany({ where: { id, schoolId }, data });
};

export const softDeleteMatiere = async (id, schoolId) => {
  return await prisma.matiere.updateMany({ where: { id, schoolId }, data: { isActive: false } });
};

export const restoreMatiere = async (id, schoolId) => {
  return await prisma.matiere.updateMany({ where: { id, schoolId }, data: { isActive: true } });
};

export const getMatieresGroupes = async (schoolId) => {
  return await prisma.matiereGroupe.findMany({
    where: { schoolId },
    include: { matieres: true },
    orderBy: { nom: 'asc' },
  });
};

export const createMatiereGroupe = async (schoolId, nom) => {
  return await prisma.matiereGroupe.create({ data: { schoolId, nom } });
};

export const deleteMatiereGroupe = async (id, schoolId) => {
  await prisma.matiere.updateMany({ where: { groupeId: id, schoolId }, data: { groupeId: null } });
  return await prisma.matiereGroupe.deleteMany({ where: { id, schoolId } });
};