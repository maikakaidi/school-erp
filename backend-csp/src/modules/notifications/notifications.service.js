import prisma from '../../config/database.js';

export const createNotification = async (schoolId, { type, title, message, link }) => {
  return await prisma.notification.create({
    data: { schoolId, type, title, message, link: link || null },
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

export const markAsRead = async (schoolId, notificationId) => {
  return await prisma.notification.updateMany({
    where: { id: notificationId, schoolId },
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
