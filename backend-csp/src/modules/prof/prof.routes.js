import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireEnseignant } from '../../middlewares/enseignant.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import {
  getMe, getAffectations, getEleves, getNotes, saveNotes,
  getAbsences, createAbsence, deleteAbsence, getEmploiDuTemps,
  getNotifications, getUnreadNotificationsCount, markNotificationRead,
  getAnnonces, getUnreadAnnoncesCount, markAnnonceRead,
  getDashboard,
} from './prof.controller.js';

const router = express.Router();
router.use(authenticate, requireEnseignant, checkSubscription);

/**
 * @swagger
 * /prof/me: Profil de l'enseignant connecté
 * /prof/affectations: Classes et matières enseignées
 * /prof/eleves: Élèves d'une classe enseignée
 * /prof/notes: Notes d'une classe/matière (GET) et saisie (PUT)
 * /prof/absences: Absences et retards des classes enseignées
 * /prof/emploi-du-temps: Emploi du temps de l'enseignant
 * /prof/notifications: Notifications ciblées enseignant
 * /prof/annonces: Annonces publiées par l'école
 */
router.get('/me', getMe);
router.get('/dashboard', getDashboard);
router.get('/affectations', getAffectations);
router.get('/eleves', getEleves);
router.get('/notes', getNotes);
router.put('/notes', saveNotes);
router.get('/absences', getAbsences);
router.post('/absences', createAbsence);
router.delete('/absences/:id', deleteAbsence);
router.get('/emploi-du-temps', getEmploiDuTemps);
router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadNotificationsCount);
router.put('/notifications/:id/read', markNotificationRead);
router.get('/annonces', getAnnonces);
router.get('/annonces/unread-count', getUnreadAnnoncesCount);
router.put('/annonces/:id/read', markAnnonceRead);

export default router;
