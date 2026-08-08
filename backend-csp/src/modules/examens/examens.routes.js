import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import {
  getAll,
  getOne,
  create,
  deleteExamen,
  addSalle,
  addResultat,
  getResultats,
  repartition,
  getClassement,
  exportClassementPDF,
} from './examens.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.delete('/:id', deleteExamen);
router.post('/:examenId/salles', addSalle);
router.post('/:examenId/resultats', addResultat);
router.get('/:examenId/resultats', getResultats);
router.get('/:examenId/repartition', repartition);
router.get('/:examenId/classement', getClassement);
router.get('/:examenId/export-pdf', exportClassementPDF);

export default router;