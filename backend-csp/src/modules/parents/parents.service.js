import prisma from '../../config/database.js';
import bcrypt from 'bcrypt';

const includeParent = () => ({
  eleves: {
    include: {
      eleve: {
        select: { id: true, nom: true, prenom: true, matricule: true, sexe: true },
      },
    },
  },
});

export const getAllParents = async (schoolId, { search } = {}) => {
  const where = { schoolId };
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { telephone: { contains: search } },
    ];
  }
  return await prisma.parent.findMany({
    where,
    include: includeParent(),
    orderBy: { createdAt: 'desc' },
  });
};

export const getParentById = async (schoolId, id) => {
  return await prisma.parent.findFirst({
    where: { id, schoolId },
    include: includeParent(),
  });
};

export const createParent = async (schoolId, data) => {
  const eleveIds = data.eleveIds || [];
  if (eleveIds.length) {
    const count = await prisma.eleve.count({ where: { id: { in: eleveIds }, schoolId } });
    if (count !== eleveIds.length) throw new Error('Un ou plusieurs élèves invalides pour cette école');
  }
  const hashedPassword = await bcrypt.hash(data.password, 10);
  return await prisma.parent.create({
    data: {
      schoolId,
      nom: data.nom,
      telephone: data.telephone,
      password: hashedPassword,
      email: data.email || null,
      adresse: data.adresse || null,
      eleves: eleveIds.length
        ? { create: eleveIds.map((eleveId) => ({ schoolId, eleveId })) }
        : undefined,
    },
    include: includeParent(),
  });
};

export const updateParent = async (schoolId, id, data) => {
  const existing = await prisma.parent.findFirst({ where: { id, schoolId } });
  if (!existing) throw new Error('Parent non trouvé');

  const patch = {};
  if (data.nom) patch.nom = data.nom;
  if (data.telephone) patch.telephone = data.telephone;
  if (data.email !== undefined) patch.email = data.email || null;
  if (data.adresse !== undefined) patch.adresse = data.adresse || null;
  if (data.password) patch.password = await bcrypt.hash(data.password, 10);
  if (data.isActive !== undefined) patch.isActive = data.isActive;

  const updated = await prisma.parent.update({ where: { id }, data: patch });

  if (data.eleveIds) {
    const eleveIds = data.eleveIds;
    const count = await prisma.eleve.count({ where: { id: { in: eleveIds }, schoolId } });
    if (count !== eleveIds.length) throw new Error('Un ou plusieurs élèves invalides pour cette école');
    await prisma.parentEleve.deleteMany({ where: { parentId: id } });
    if (eleveIds.length) {
      await prisma.parentEleve.createMany({
        data: eleveIds.map((eleveId) => ({ schoolId, parentId: id, eleveId })),
      });
    }
  }
  return updated;
};

export const deleteParent = async (schoolId, id) => {
  return await prisma.parent.deleteMany({ where: { id, schoolId } });
};
