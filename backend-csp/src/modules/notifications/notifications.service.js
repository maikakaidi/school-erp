import prisma from '../../config/database.js';

export const createNotification = async (schoolId, { type, title, message, link, recipientType, recipientId }) => {
  return await prisma.notification.create({
    data: {
      schoolId,
      type,
      title,
      message,
      link: link || null,
      recipientType: recipientType || null,
      recipientId: recipientId || null,
    },
  });
};

export const createNotificationsMany = async (schoolId, list) => {
  if (!list || list.length === 0) return { count: 0 };
  return await prisma.notification.createMany({
    data: list.map((n) => ({
      schoolId,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link || null,
      recipientType: n.recipientType || 'parent',
      recipientId: n.recipientId,
    })),
  });
};

export const getNotifications = async (schoolId, { unreadOnly, limit }) => {
  const where = { schoolId };
  if (unreadOnly) where.isRead = false;
  return await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit || 50,
  });
};

export const getUnreadCount = async (schoolId) => {
  return await prisma.notification.count({
    where: { schoolId, isRead: false },
  });
};

const actorScope = (actorType, actorId) => ({
  OR: [
    { recipientType: actorType, recipientId: actorId },
    { recipientType: 'ecole' },
  ],
});

export const getNotificationsForActor = async (schoolId, actorType, actorId, { unreadOnly, limit } = {}) => {
  const where = { schoolId, ...actorScope(actorType, actorId) };
  if (unreadOnly) where.isRead = false;
  return await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit || 50,
  });
};

export const getUnreadCountForActor = async (schoolId, actorType, actorId) => {
  return await prisma.notification.count({
    where: { schoolId, isRead: false, ...actorScope(actorType, actorId) },
  });
};

export const markAsRead = async (schoolId, notificationId) => {
  return await prisma.notification.updateMany({
    where: { id: notificationId, schoolId },
    data: { isRead: true },
  });
};

export const markAsReadForActor = async (schoolId, actorType, actorId, notificationId) => {
  return await prisma.notification.updateMany({
    where: { id: notificationId, schoolId, ...actorScope(actorType, actorId) },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (schoolId) => {
  return await prisma.notification.updateMany({
    where: { schoolId, isRead: false },
    data: { isRead: true },
  });
};

export const deleteNotification = async (schoolId, notificationId) => {
  return await prisma.notification.deleteMany({
    where: { id: notificationId, schoolId },
  });
};

export const deleteAllRead = async (schoolId) => {
  return await prisma.notification.deleteMany({
    where: { schoolId, isRead: true },
  });
};
