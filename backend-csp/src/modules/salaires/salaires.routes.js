import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import {
  getListe,
  calculer,
  payer,
  creerAvance,
  getAvances,
  telechargerReçu,
} from './salaires.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);

router.get('/', getListe);
router.post('/calculer', calculer);
router.patch('/:id/payer', payer);
router.get('/avances', getAvances);
router.post('/avances', creerAvance);
router.get('/recu/:id', telechargerReçu);

export default router;