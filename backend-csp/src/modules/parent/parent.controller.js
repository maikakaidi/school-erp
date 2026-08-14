import * as parentService from './parent.service.js';
import { z } from 'zod';

const childQuerySchema = z.object({
  childId: z.string().min(1),
  anneeScolaire: z.string().optional(),
});

const parseQuery = (schema, query) => {
  try {
    return schema.parse(query);
  } catch (error) {
    error.status = 400;
    throw error;
  }
};

export const getMe = async (req, res, next) => {
  try {
    const result = await parentService.getProfile(req.user.schoolId, req.user.parentId);
    res.json(result);
  } catch (error) { next(error); }
};

export const getChildren = async (req, res, next) => {
  try {
    const children = await parentService.getChildren(req.user.schoolId, req.user.parentId);
    res.json(children);
  } catch (error) { next(error); }
};

export const getDashboard = async (req, res, next) => {
  try {
    const { childId, anneeScolaire } = parseQuery(childQuerySchema, req.query);
    const data = await parentService.getDashboard(req.user.schoolId, req.user.parentId, childId, anneeScolaire);
    res.json(data);
  } catch (error) { next(error); }
};

export const getNotes = async (req, res, next) => {
  try {
    const { childId, anneeScolaire } = parseQuery(childQuerySchema, req.query);
    const data = await parentService.getNotes(req.user.schoolId, req.user.parentId, childId, anneeScolaire);
    res.json(data);
  } catch (error) { next(error); }
};

export const getPayments = async (req, res, next) => {
  try {
    const { childId, anneeScolaire } = parseQuery(childQuerySchema, req.query);
    const data = await parentService.getPayments(req.user.schoolId, req.user.parentId, childId, anneeScolaire);
    res.json(data);
  } catch (error) { next(error); }
};

export const getAbsences = async (req, res, next) => {
  try {
    const { childId, anneeScolaire } = parseQuery(childQuerySchema, req.query);
    const data = await parentService.getAbsences(req.user.schoolId, req.user.parentId, childId, anneeScolaire);
    res.json(data);
  } catch (error) { next(error); }
};

const parseBool = (v) => v === 'true';

export const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly, limit } = req.query;
    const data = await parentService.getNotifications(req.user.schoolId, req.user.parentId, {
      unreadOnly: parseBool(unreadOnly),
      limit: limit ? parseInt(limit) : undefined,
    });
    res.json(data);
  } catch (error) { next(error); }
};

export const getUnreadNotificationsCount = async (req, res, next) => {
  try {
    const count = await parentService.getUnreadNotificationsCount(req.user.schoolId, req.user.parentId);
    res.json({ count });
  } catch (error) { next(error); }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    await parentService.markNotificationRead(req.user.schoolId, req.user.parentId, req.params.id);
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) { next(error); }
};

export const getAnnonces = async (req, res, next) => {
  try {
    const { unreadOnly, limit } = req.query;
    const data = await parentService.getAnnonces(req.user.schoolId, req.user.parentId, {
      unreadOnly: parseBool(unreadOnly),
      limit: limit ? parseInt(limit) : undefined,
    });
    res.json(data);
  } catch (error) { next(error); }
};

export const getUnreadAnnoncesCount = async (req, res, next) => {
  try {
    const count = await parentService.getUnreadAnnoncesCount(req.user.schoolId, req.user.parentId);
    res.json({ count });
  } catch (error) { next(error); }
};

export const markAnnonceRead = async (req, res, next) => {
  try {
    await parentService.markAnnonceRead(req.user.schoolId, req.user.parentId, req.params.id);
    res.json({ message: 'Annonce marquée comme lue' });
  } catch (error) { next(error); }
};
