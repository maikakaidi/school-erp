import prisma from '../../config/database.js';
import { createNotificationsMany } from '../notifications/notifications.service.js';

const toMidday = (dateStr) => new Date(`${dateStr}T12:00:00.000Z`);

const includeClasse = () => ({ classe: { select: { id: true, nom: true } } });

export const getAllAnnonces = async (schoolId, { cible, page = 1, limit = 20 } = {}) => {
  const where = { schoolId };
  if (cible) where.cible = cible;

  const [annonces, total] = await Promise.all([
    prisma.annonce.findMany({
      where,
      include: {
        classe: { select: { id: true, nom: true } },
        _count: { select: { reads: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.annonce.count({ where }),
  ]);

  return { annonces, total, page, totalPages: Math.ceil(total / limit) };
};

export const getAnnonceById = async (schoolId, id) => {
  return await prisma.annonce.findFirst({
    where: { id, schoolId },
    include: { ...includeClasse(), reads: { select: { id: true, readerType: true, readerId: true, readAt: true } } },
  });
};

const getTargetParentIds = async (schoolId, cible, classeId) => {
  if (cible === 'classe') {
    const inscriptions = await prisma.inscription.findMany({
      where: { schoolId, classeId },
      select: { eleveId: true },
    });
    const eleveIds = [...new Set(inscriptions.map((i) => i.eleveId))];
    if (eleveIds.length === 0) return [];
    const links = await prisma.parentEleve.findMany({
      where: { schoolId, eleveId: { in: eleveIds } },
      select: { parentId: true },
    });
    return [...new Set(links.map((l) => l.parentId))];
  }
  // ecole | parents → tous les parents de l'école
  const parents = await prisma.parent.findMany({
    where: { schoolId, isActive: true },
    select: { id: true },
  });
  return parents.map((p) => p.id);
};

export const createAnnonce = async (schoolId, data) => {
  const cible = data.cible || 'ecole';
  if (cible === 'classe' && !data.classeId) {
    const error = new Error('La classe est requise pour la cible "classe"');
    error.status = 400;
    throw error;
  }
  const classeId = cible === 'classe' ? data.classeId : null;

  const annonce = await prisma.annonce.create({
    data: {
      schoolId,
      titre: data.titre,
      message: data.message,
      type: data.type || 'info',
      cible,
      classeId,
      date: data.date ? toMidday(data.date) : new Date(),
    },
    include: includeClasse(),
  });

  try {
    const parentIds = await getTargetParentIds(schoolId, cible, classeId);
    if (parentIds.length) {
      await createNotificationsMany(schoolId, parentIds.map((parentId) => ({
        type: 'annonce',
        title: annonce.titre,
        message: annonce.message,
        link: '/parent/annonces',
        recipientType: 'parent',
        recipientId: parentId,
      })));
    }
  } catch (e) {
    // non bloquant : l'annonce est créée même si la notification échoue
  }

  return annonce;
};

export const updateAnnonce = async (schoolId, id, data) => {
  const existing = await prisma.annonce.findFirst({ where: { id, schoolId } });
  if (!existing) throw new Error('Annonce non trouvée');

  const patch = {};
  if (data.titre !== undefined) patch.titre = data.titre;
  if (data.message !== undefined) patch.message = data.message;
  if (data.type !== undefined) patch.type = data.type;
  if (data.isActive !== undefined) patch.isActive = data.isActive;
  if (data.date !== undefined) patch.date = toMidday(data.date);

  if (data.cible !== undefined) {
    patch.cible = data.cible;
    if (data.cible === 'classe') {
      if (!data.classeId) {
        const error = new Error('La classe est requise pour la cible "classe"');
        error.status = 400;
        throw error;
      }
      patch.classeId = data.classeId;
    } else {
      patch.classeId = null;
    }
  } else if (data.classeId !== undefined) {
    patch.classeId = data.classeId;
  }

  return await prisma.annonce.update({
    where: { id },
    data: patch,
    include: includeClasse(),
  });
};

export const deleteAnnonce = async (schoolId, id) => {
  return await prisma.annonce.deleteMany({ where: { id, schoolId } });
};

const buildParentWhere = async (schoolId, parentId) => {
  const links = await prisma.parentEleve.findMany({
    where: { parentId, schoolId },
    select: { eleve: { select: { inscriptions: { select: { classeId: true }, orderBy: { dateInscription: 'desc' } } } } },
  });
  const classeIds = [...new Set(links.flatMap((l) => l.eleve.inscriptions.map((i) => i.classeId)))];
  return {
    schoolId,
    isActive: true,
    OR: [
      { cible: 'ecole' },
      { cible: 'parents' },
      ...(classeIds.length ? classeIds.map((classeId) => ({ cible: 'classe', classeId })) : []),
    ],
  };
};

export const getAnnoncesForParent = async (schoolId, parentId, { unreadOnly, limit } = {}) => {
  const where = await buildParentWhere(schoolId, parentId);
  if (unreadOnly) where.reads = { none: { readerType: 'parent', readerId: parentId } };

  const annonces = await prisma.annonce.findMany({
    where,
    include: {
      classe: { select: { id: true, nom: true } },
      reads: {
        where: { readerType: 'parent', readerId: parentId },
        select: { readAt: true },
      },
    },
    orderBy: { date: 'desc' },
    take: limit || 50,
  });

  return annonces.map(({ reads, ...a }) => ({
    ...a,
    isRead: reads.length > 0,
    readAt: reads[0]?.readAt || null,
  }));
};

export const getUnreadAnnoncesCountForParent = async (schoolId, parentId) => {
  const where = await buildParentWhere(schoolId, parentId);
  where.reads = { none: { readerType: 'parent', readerId: parentId } };
  return await prisma.annonce.count({ where });
};

export const markAnnonceReadForParent = async (schoolId, parentId, annonceId) => {
  const annonce = await prisma.annonce.findFirst({ where: { id: annonceId, schoolId, isActive: true } });
  if (!annonce) {
    const error = new Error('Annonce non trouvée');
    error.status = 404;
    throw error;
  }
  return await prisma.annonceRead.upsert({
    where: { annonceId_readerType_readerId: { annonceId, readerType: 'parent', readerId: parentId } },
    create: { annonceId, readerType: 'parent', readerId: parentId },
    update: {},
  });
};
