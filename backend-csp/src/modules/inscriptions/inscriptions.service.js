import prisma from '../../config/database.js';
import { isYearArchived } from '../academic-years/academicYears.service.js';

export const getAllInscriptions = async (schoolId, anneeScolaire) => {
  const where = { schoolId };
  if (anneeScolaire) where.anneeScolaire = anneeScolaire;
  return await prisma.inscription.findMany({
    where,
    include: { eleve: true, classe: true },
    orderBy: { dateInscription: 'desc' },
  });
};

export const getInscriptionById = async (id, schoolId) => {
  return await prisma.inscription.findFirst({
    where: { id, schoolId },
    include: { eleve: true, classe: true },
  });
};

export const createInscription = async (schoolId, data) => {
  if (await isYearArchived(schoolId, data.anneeScolaire)) {
    throw Object.assign(new Error('Cette année scolaire est archivée — inscription impossible'), { status: 403 });
  }
  // Vérifier que l'élève et la classe appartiennent bien à l'école
  const eleve = await prisma.eleve.findFirst({ where: { id: data.eleveId, schoolId } });
  if (!eleve) throw new Error('Élève non trouvé dans cette école');
  const classe = await prisma.classe.findFirst({ where: { id: data.classeId, schoolId } });
  if (!classe) throw new Error('Classe non trouvée dans cette école');

  // Vérifier s'il existe déjà une inscription pour cet élève cette année
  const existing = await prisma.inscription.findFirst({
    where: { schoolId, eleveId: data.eleveId, anneeScolaire: data.anneeScolaire },
  });
  if (existing) throw new Error('Cet élève est déjà inscrit pour cette année scolaire');

  return await prisma.inscription.create({
    data: {
      ...data,
      schoolId,
      dateInscription: new Date(),
    },
  });
};

export const updateInscription = async (id, schoolId, data) => {
  return await prisma.inscription.updateMany({
    where: { id, schoolId },
    data,
  });
};

export const deleteInscription = async (id, schoolId) => {
  return await prisma.inscription.deleteMany({ where: { id, schoolId } });
};