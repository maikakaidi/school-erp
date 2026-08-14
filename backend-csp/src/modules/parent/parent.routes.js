import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireParent } from '../../middlewares/parent.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import {
  getMe, getChildren, getDashboard, getNotes, getPayments, getAbsences,
  getNotifications, getUnreadNotificationsCount, markNotificationRead,
  getAnnonces, getUnreadAnnoncesCount, markAnnonceRead,
} from './parent.controller.js';

const router = express.Router();
router.use(authenticate, requireParent, checkSubscription);

/**
 * @swagger
 * /parent/me: Profil du parent connecté
 * /parent/children: Enfants du parent connecté
 * /parent/dashboard: Tableau de bord (notes + paiements) par enfant
 * /parent/notes: Détail des notes et moyennes par enfant
 * /parent/payments: Paiements et reste à payer par enfant
 * /parent/absences: Absences et retards par enfant
 * /parent/notifications: Notifications ciblées du parent
 * /parent/annonces: Annonces publiées par l'école
 */
router.get('/me', getMe);
router.get('/children', getChildren);
router.get('/dashboard', getDashboard);
router.get('/notes', getNotes);
router.get('/payments', getPayments);
router.get('/absences', getAbsences);
router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadNotificationsCount);
router.put('/notifications/:id/read', markNotificationRead);
router.get('/annonces', getAnnonces);
router.get('/annonces/unread-count', getUnreadAnnoncesCount);
router.put('/annonces/:id/read', markAnnonceRead);

export default router;
