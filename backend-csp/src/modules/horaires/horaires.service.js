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

export const getHorairesByClasse = async (schoolId, classeId, mois, annee) => {
  const m = mois ? parseInt(mois) : undefined;
  const y = annee ? parseInt(annee) : undefined;
  return await prisma.horaireEnseignant.findMany({
    where: {
      schoolId,
      classeId,
      ...(m ? { mois: m } : {}),
      ...(y ? { annee: y } : {}),
    },
    include: {
      enseignant: { select: { id: true, nom: true, prenom: true } },
      matiere: { select: { id: true, libelle: true } },
    },
    orderBy: [{ jour: 'asc' }, { heureDebut: 'asc' }],
  });
};

export const getEmploiDuTempsEleve = async (schoolId, eleveId, mois, annee) => {
  const inscription = await prisma.inscription.findFirst({
    where: { schoolId, eleveId },
    orderBy: { dateInscription: 'desc' },
    select: { classeId: true, classe: { select: { id: true, nom: true } } },
  });
  if (!inscription) {
    const error = new Error('Élève non inscrit');
    error.status = 404;
    throw error;
  }
  const horaires = await getHorairesByClasse(schoolId, inscription.classeId, mois, annee);
  return { eleveId, classe: inscription.classe, horaires };
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