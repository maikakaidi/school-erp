import prisma from '../../config/database.js';

export const conversationKey = (actorType, actorId) => `${actorType}:${actorId}`;

const getActor = (schoolId, actorType, actorId) => {
  if (actorType === 'parent') return prisma.parent.findFirst({ where: { id: actorId, schoolId } });
  if (actorType === 'eleve') return prisma.eleve.findFirst({
    where: { id: actorId, schoolId },
    include: { inscriptions: { include: { classe: true }, orderBy: { dateInscription: 'desc' }, take: 1 } },
  });
  if (actorType === 'enseignant') return prisma.enseignant.findFirst({ where: { id: actorId, schoolId } });
  return null;
};

export const actorLabel = async (schoolId, actorType, actorId) => {
  const actor = await getActor(schoolId, actorType, actorId);
  if (!actor) return { id: actorId, label: 'Inconnu', sub: '' };
  if (actorType === 'parent') return { id: actorId, label: `${actor.nom}`, sub: actor.telephone };
  if (actorType === 'enseignant') return { id: actorId, label: `${actor.nom} ${actor.prenom}`, sub: actor.telephone };
  return { id: actorId, label: `${actor.prenom} ${actor.nom}`, sub: `${actor.matricule}`, classe: actor.inscriptions?.[0]?.classe?.nom || '' };
};

export const sendFromSchool = async (schoolId, { recipientType, recipientId, sujet, contenu }) => {
  if (!['parent', 'eleve', 'enseignant'].includes(recipientType)) {
    const error = new Error('Destinataire invalide');
    error.status = 400;
    throw error;
  }
  const actor = await getActor(schoolId, recipientType, recipientId);
  if (!actor) {
    const error = new Error('Destinataire introuvable');
    error.status = 404;
    throw error;
  }
  return await prisma.message.create({
    data: {
      schoolId,
      conversationKey: conversationKey(recipientType, recipientId),
      senderType: 'ecole',
      senderId: null,
      recipientType,
      recipientId,
      sujet,
      contenu,
    },
  });
};

export const getConversations = async (schoolId) => {
  const messages = await prisma.message.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'asc' },
  });
  const groups = {};
  for (const m of messages) {
    const key = m.conversationKey;
    if (!groups[key]) {
      groups[key] = { key, actorType: m.recipientType === 'ecole' ? m.senderType : m.recipientType, actorId: m.recipientType === 'ecole' ? m.senderId : m.recipientId, last: m, unread: 0 };
    }
    groups[key].last = m;
    if (m.senderType !== 'ecole' && !m.isRead) groups[key].unread += 1;
  }
  const list = Object.values(groups);
  for (const c of list) {
    const info = await actorLabel(schoolId, c.actorType, c.actorId);
    c.actor = info;
  }
  return list
    .filter((c) => c.actor.label !== 'Inconnu')
    .sort((a, b) => new Date(b.last.createdAt) - new Date(a.last.createdAt))
    .map((c) => ({
      actorType: c.actorType,
      actorId: c.actorId,
      actor: c.actor,
      sujet: c.last.sujet,
      contenu: c.last.contenu,
      createdAt: c.last.createdAt,
      unread: c.unread,
    }));
};

export const getConversation = async (schoolId, actorType, actorId) => {
  const key = conversationKey(actorType, actorId);
  const messages = await prisma.message.findMany({
    where: { schoolId, conversationKey: key },
    orderBy: { createdAt: 'asc' },
  });
  await prisma.message.updateMany({
    where: { schoolId, conversationKey: key, senderType: { not: 'ecole' }, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return {
    actor: await actorLabel(schoolId, actorType, actorId),
    messages: messages.map((m) => ({
      id: m.id,
      senderType: m.senderType,
      contenu: m.contenu,
      createdAt: m.createdAt,
      fromSchool: m.senderType === 'ecole',
    })),
  };
};

export const replyFromActor = async (schoolId, actorType, actorId, { contenu }) => {
  if (!['parent', 'eleve', 'enseignant'].includes(actorType)) {
    const error = new Error('Expéditeur invalide');
    error.status = 403;
    throw error;
  }
  const actor = await getActor(schoolId, actorType, actorId);
  if (!actor) {
    const error = new Error('Compte invalide');
    error.status = 403;
    throw error;
  }
  const key = conversationKey(actorType, actorId);
  const lastSchool = await prisma.message.findFirst({
    where: { schoolId, conversationKey: key, senderType: 'ecole' },
    orderBy: { createdAt: 'desc' },
    select: { sujet: true },
  });
  return await prisma.message.create({
    data: {
      schoolId,
      conversationKey: key,
      senderType: actorType,
      senderId: actorId,
      recipientType: 'ecole',
      recipientId: null,
      sujet: lastSchool?.sujet || 'Réponse',
      contenu,
    },
  });
};

export const getMyConversation = async (schoolId, actorType, actorId) => {
  const key = conversationKey(actorType, actorId);
  const messages = await prisma.message.findMany({
    where: { schoolId, conversationKey: key },
    orderBy: { createdAt: 'asc' },
  });
  return messages.map((m) => ({
    id: m.id,
    senderType: m.senderType,
    contenu: m.contenu,
    sujet: m.sujet,
    createdAt: m.createdAt,
    fromSchool: m.senderType === 'ecole',
  }));
};

export const markReadForActor = async (schoolId, actorType, actorId) => {
  const key = conversationKey(actorType, actorId);
  return await prisma.message.updateMany({
    where: { schoolId, conversationKey: key, senderType: 'ecole', isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
};

export const getUnreadCountForActor = async (schoolId, actorType, actorId) => {
  const key = conversationKey(actorType, actorId);
  return await prisma.message.count({
    where: { schoolId, conversationKey: key, senderType: 'ecole', isRead: false },
  });
};

export const getUnreadCountForSchool = async (schoolId) => {
  return await prisma.message.count({
    where: { schoolId, senderType: { not: 'ecole' }, isRead: false },
  });
};
