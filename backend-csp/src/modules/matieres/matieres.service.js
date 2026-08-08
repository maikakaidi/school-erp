import prisma from '../../config/database.js';

export const getAllMatieres = async (schoolId) => {
  return await prisma.matiere.findMany({
    where: { schoolId },
    orderBy: { libelle: 'asc' },
  });
};

export const getMatiereById = async (id, schoolId) => {
  return await prisma.matiere.findFirst({ where: { id, schoolId } });
};

export const createMatiere = async (schoolId, data) => {
  return await prisma.matiere.create({ data: { ...data, schoolId } });
};

export const updateMatiere = async (id, schoolId, data) => {
  return await prisma.matiere.updateMany({ where: { id, schoolId }, data });
};

export const deleteMatiere = async (id, schoolId) => {
  return await prisma.matiere.deleteMany({ where: { id, schoolId } });
};