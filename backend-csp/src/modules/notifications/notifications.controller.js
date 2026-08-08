import * as notificationService from './notifications.service.js';

export const getAll = async (req, res, next) => {
  try {
    const { unreadOnly, limit } = req.query;
    const notifications = await notificationService.getNotifications(req.user.schoolId, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit) : undefined,
    });
    res.json(notifications);
  } catch (error) { next(error); }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.schoolId);
    res.json({ count });
  } catch (error) { next(error); }
};

export const markRead = async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.user.schoolId, req.params.id);
    res.json({ message: 'Marquée comme lue' });
  } catch (error) { next(error); }
};

export const markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.schoolId);
    res.json({ message: 'Toutes marquées comme lues' });
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.user.schoolId, req.params.id);
    res.json({ message: 'Notification supprimée' });
  } catch (error) { next(error); }
};

export const removeAllRead = async (req, res, next) => {
  try {
    await notificationService.deleteAllRead(req.user.schoolId);
    res.json({ message: 'Lues supprimées' });
  } catch (error) { next(error); }
};
