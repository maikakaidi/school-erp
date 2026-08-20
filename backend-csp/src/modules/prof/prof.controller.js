import * as profService from './prof.service.js';
import { saveNotesSchema, createAbsenceSchema } from './prof.validation.js';

const schoolId = (req) => req.user.schoolId;
const enseignantId = (req) => req.user.enseignantId;

export const getMe = async (req, res, next) => {
  try {
    res.json(await profService.getProfile(schoolId(req), enseignantId(req)));
  } catch (error) { next(error); }
};

export const getAffectations = async (req, res, next) => {
  try {
    const { anneeScolaire } = req.query;
    res.json(await profService.getAffectations(schoolId(req), enseignantId(req), anneeScolaire));
  } catch (error) { next(error); }
};

export const getEleves = async (req, res, next) => {
  try {
    const { classeId } = req.query;
    if (!classeId) return res.status(400).json({ message: 'classeId requis' });
    res.json(await profService.getEleves(schoolId(req), enseignantId(req), classeId));
  } catch (error) { next(error); }
};

export const getNotes = async (req, res, next) => {
  try {
    const { classeId, matiereId, semestre, anneeScolaire } = req.query;
    if (!classeId || !matiereId) return res.status(400).json({ message: 'classeId et matiereId requis' });
    res.json(await profService.getNotes(schoolId(req), enseignantId(req), { classeId, matiereId, semestre, anneeScolaire }));
  } catch (error) { next(error); }
};

export const saveNotes = async (req, res, next) => {
  try {
    const data = saveNotesSchema.parse(req.body);
    const result = await profService.saveNotes(schoolId(req), enseignantId(req), data);
    res.json({ message: `${result.saved} note(s) enregistrée(s)`, ...result });
  } catch (error) { next(error); }
};

export const getAbsences = async (req, res, next) => {
  try {
    const { classeId, anneeScolaire, dateDebut, dateFin, type, page, limit } = req.query;
    res.json(await profService.getAbsences(schoolId(req), enseignantId(req), {
      classeId, anneeScolaire, dateDebut, dateFin, type,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    }));
  } catch (error) { next(error); }
};

export const createAbsence = async (req, res, next) => {
  try {
    const data = createAbsenceSchema.parse(req.body);
    const absence = await profService.createAbsence(schoolId(req), enseignantId(req), data);
    res.status(201).json(absence);
  } catch (error) { next(error); }
};

export const deleteAbsence = async (req, res, next) => {
  try {
    await profService.deleteAbsence(schoolId(req), enseignantId(req), req.params.id);
    res.status(204).send();
  } catch (error) { next(error); }
};

export const getEmploiDuTemps = async (req, res, next) => {
  try {
    const { mois, annee } = req.query;
    res.json(await profService.getEmploiDuTemps(schoolId(req), enseignantId(req), mois, annee));
  } catch (error) { next(error); }
};

export const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly, limit } = req.query;
    res.json(await profService.getNotifications(schoolId(req), enseignantId(req), {
      unreadOnly: unreadOnly === 'true',
      limit: parseInt(limit) || 50,
    }));
  } catch (error) { next(error); }
};

export const getUnreadNotificationsCount = async (req, res, next) => {
  try {
    res.json({ count: await profService.getUnreadNotificationsCount(schoolId(req), enseignantId(req)) });
  } catch (error) { next(error); }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    await profService.markNotificationRead(schoolId(req), enseignantId(req), req.params.id);
    res.json({ message: 'Marquée comme lue' });
  } catch (error) { next(error); }
};

export const getAnnonces = async (req, res, next) => {
  try {
    const { unreadOnly, limit } = req.query;
    res.json(await profService.getAnnonces(schoolId(req), enseignantId(req), {
      unreadOnly: unreadOnly === 'true',
      limit: parseInt(limit) || 50,
    }));
  } catch (error) { next(error); }
};

export const getUnreadAnnoncesCount = async (req, res, next) => {
  try {
    res.json({ count: await profService.getUnreadAnnoncesCount(schoolId(req), enseignantId(req)) });
  } catch (error) { next(error); }
};

export const markAnnonceRead = async (req, res, next) => {
  try {
    await profService.markAnnonceRead(schoolId(req), enseignantId(req), req.params.id);
    res.json({ message: 'Annonce marquée comme lue' });
  } catch (error) { next(error); }
};

export const getDashboard = async (req, res, next) => {
  try {
    res.json(await profService.getDashboard(schoolId(req), enseignantId(req)));
  } catch (error) { next(error); }
};
