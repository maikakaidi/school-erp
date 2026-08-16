import * as saService from './superAdmin.service.js';
import { logAudit, auditActorFromReq } from '../audit/audit.service.js';

export const getAllSchools = async (req, res, next) => {
  try {
    const schools = await saService.getAllSchools();
    res.json(schools);
  } catch (error) { next(error); }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await saService.getDashboardStats();
    res.json(stats);
  } catch (error) { next(error); }
};

export const activateSchool = async (req, res, next) => {
  try {
    const school = await saService.activateSchool(req.params.id);
    logAudit({ ...auditActorFromReq(req), action: 'school.activate', targetType: 'school', targetId: req.params.id });
    res.json({ message: 'École activée avec succès', school });
  } catch (error) { next(error); }
};

export const deactivateSchool = async (req, res, next) => {
  try {
    const school = await saService.deactivateSchool(req.params.id);
    logAudit({ ...auditActorFromReq(req), action: 'school.deactivate', targetType: 'school', targetId: req.params.id });
    res.json({ message: 'École désactivée', school });
  } catch (error) { next(error); }
};

export const renewSchool = async (req, res, next) => {
  try {
    const days = req.body.days || 365;
    const school = await saService.renewSchool(req.params.id, days);
    logAudit({ ...auditActorFromReq(req), action: 'subscription.renew', targetType: 'school', targetId: req.params.id, payload: { days } });
    res.json({ message: `Abonnement renouvelé de ${days} jours`, school });
  } catch (error) { next(error); }
};

export const addDays = async (req, res, next) => {
  try {
    const { days } = req.body;
    if (!days || days <= 0) return res.status(400).json({ message: 'Nombre de jours invalide' });
    const school = await saService.addDays(req.params.id, days);
    logAudit({ ...auditActorFromReq(req), action: 'subscription.add_days', targetType: 'school', targetId: req.params.id, payload: { days } });
    res.json({ message: `${days} jours ajoutés`, school });
  } catch (error) { next(error); }
};

export const resetSchoolPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }
    await saService.resetSchoolPassword(req.params.id, newPassword);
    logAudit({ ...auditActorFromReq(req), action: 'school.reset_password', targetType: 'school', targetId: req.params.id, payload: { mustChangePassword: true } });
    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) { next(error); }
};

export const deleteSchool = async (req, res, next) => {
  try {
    const school = await saService.deleteSchool(req.params.id);
    logAudit({ ...auditActorFromReq(req), action: 'school.delete', targetType: 'school', targetId: req.params.id, payload: { name: school?.name, phone: school?.phone } });
    res.status(200).json({ message: 'École supprimée définitivement' });
  } catch (error) { next(error); }
};

export const anonymizeSchool = async (req, res, next) => {
  try {
    const result = await saService.anonymizeSchoolData(req.params.id);
    logAudit({ ...auditActorFromReq(req), action: 'school.anonymize', targetType: 'school', targetId: req.params.id });
    res.status(200).json({ message: 'Données personnelles anonymisées', ...result });
  } catch (error) { next(error); }
};

export const getStorageStats = async (req, res, next) => {
  try {
    const stats = await saService.getStorageStats();
    res.json(stats);
  } catch (error) { next(error); }
};
