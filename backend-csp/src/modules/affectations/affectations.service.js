import prisma from '../../config/database.js';

export const getAllAffectations = async (schoolId, { enseignantId } = {}) => {
  const where = { schoolId };
  if (enseignantId) where.enseignantId = enseignantId;
  return await prisma.affectation.findMany({
    where,
    include: {
      enseignant: { select: { id: true, nom: true, prenom: true, telephone: true } },
      classe: { select: { id: true, nom: true, niveau: true } },
      matiere: { select: { id: true, libelle: true, code: true } },
    },
    orderBy: [{ enseignant: { nom: 'asc' } }, { classe: { nom: 'asc' } }],
  });
};

export const getAffectationById = async (schoolId, id) => {
  return await prisma.affectation.findFirst({
    where: { id, schoolId },
    include: {
      enseignant: { select: { id: true, nom: true, prenom: true } },
      classe: { select: { id: true, nom: true } },
      matiere: { select: { id: true, libelle: true } },
    },
  });
};

export const createAffectation = async (schoolId, data) => {
  const enseignant = await prisma.enseignant.findFirst({ where: { id: data.enseignantId, schoolId } });
  if (!enseignant) throw new Error('Enseignant non trouvé');
  const classe = await prisma.classe.findFirst({ where: { id: data.classeId, schoolId } });
  if (!classe) throw new Error('Classe non trouvée');
  const matiere = await prisma.matiere.findFirst({ where: { id: data.matiereId, schoolId } });
  if (!matiere) throw new Error('Matière non trouvée');

  try {
    return await prisma.affectation.create({
      data: {
        schoolId,
        enseignantId: data.enseignantId,
        classeId: data.classeId,
        matiereId: data.matiereId,
        isActive: data.isActive !== false,
      },
    });
  } catch (e) {
    if (e.code === 'P2002') throw new Error('Cette affectation existe déjà (enseignant, classe, matière)');
    throw e;
  }
};

export const updateAffectation = async (schoolId, id, data) => {
  const existing = await prisma.affectation.findFirst({ where: { id, schoolId } });
  if (!existing) throw new Error('Affectation non trouvée');

  const patch = {};
  if (data.classeId !== undefined) {
    const classe = await prisma.classe.findFirst({ where: { id: data.classeId, schoolId } });
    if (!classe) throw new Error('Classe non trouvée');
    patch.classeId = data.classeId;
  }
  if (data.matiereId !== undefined) {
    const matiere = await prisma.matiere.findFirst({ where: { id: data.matiereId, schoolId } });
    if (!matiere) throw new Error('Matière non trouvée');
    patch.matiereId = data.matiereId;
  }
  if (data.isActive !== undefined) patch.isActive = data.isActive;

  try {
    return await prisma.affectation.update({ where: { id }, data: patch });
  } catch (e) {
    if (e.code === 'P2002') throw new Error('Cette affectation existe déjà (enseignant, classe, matière)');
    throw e;
  }
};

export const deleteAffectation = async (schoolId, id) => {
  return await prisma.affectation.deleteMany({ where: { id, schoolId } });
};
