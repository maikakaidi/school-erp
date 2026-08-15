import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireEleve } from '../../middlewares/eleve.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import {
  getMe, getDashboard, getNotes, getEmploiDuTemps, getAbsences, getPayments,
} from './eleve.controller.js';

const router = express.Router();
router.use(authenticate, requireEleve, checkSubscription);

/**
 * @swagger
 * /eleve/me: Profil de l'élève connecté
 * /eleve/dashboard: Tableau de bord (notes + paiements + absences)
 * /eleve/notes: Détail des notes et moyennes
 * /eleve/emploi-du-temps: Emploi du temps de la classe de l'élève
 * /eleve/absences: Absences et retards
 * /eleve/payments: Paiements et reste à payer
 */
router.get('/me', getMe);
router.get('/dashboard', getDashboard);
router.get('/notes', getNotes);
router.get('/emploi-du-temps', getEmploiDuTemps);
router.get('/absences', getAbsences);
router.get('/payments', getPayments);

export default router;
