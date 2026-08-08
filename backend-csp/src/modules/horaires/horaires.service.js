import prisma from '../../config/database.js';

export const getAllHoraires = async (schoolId, mois, annee) => {
  const where = { schoolId };
  if (mois) where.mois = parseInt(mois);
  if (annee) where.annee = parseInt(annee);
  return await prisma.horaireEnseignant.findMany({
    where,
    include: { enseignant: true, classe: true, matiere: true },
    orderBy: [{ mois: 'asc' }, { enseignant: { nom: 'asc' } }],
  });
};

export const getHorairesByEnseignant = async (schoolId, enseignantId, mois, annee) => {
  return await prisma.horaireEnseignant.findMany({
    where: { schoolId, enseignantId, mois, annee },
    include: { classe: true, matiere: true },
  });
};

export const createHoraire = async (schoolId, data) => {
  return await prisma.horaireEnseignant.create({ data: { ...data, schoolId } });
};

export const updateHoraire = async (id, schoolId, data) => {
  return await prisma.horaireEnseignant.updateMany({ where: { id, schoolId }, data });
};

export const deleteHoraire = async (id, schoolId) => {
  return await prisma.horaireEnseignant.deleteMany({ where: { id, schoolId } });
};