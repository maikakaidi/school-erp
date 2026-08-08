import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import { upsert, getByEleve, getByClasse, exportExcel } from './notes.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);
router.post('/', upsert);
router.get('/export', exportExcel);
router.get('/eleve', getByEleve);
router.get('/classe', getByClasse);
export default router;