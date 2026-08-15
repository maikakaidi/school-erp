import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import {
  getAssiduite, getAssiduiteExcel, getAssiduitePdf,
  getPaiements, getPaiementsExcel, getPaiementsPdf,
} from './rapports.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);

router.get('/assiduite', getAssiduite);
router.get('/assiduite/export', getAssiduiteExcel);
router.get('/assiduite/pdf', getAssiduitePdf);

router.get('/paiements-en-retard', getPaiements);
router.get('/paiements-en-retard/export', getPaiementsExcel);
router.get('/paiements-en-retard/pdf', getPaiementsPdf);

export default router;
