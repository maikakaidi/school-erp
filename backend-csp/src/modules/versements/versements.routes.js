import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import { create, getByEleve, getSituation, exportExcel } from './versements.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);

router.post('/', create);
router.get('/export', exportExcel);
router.get('/eleve', getByEleve);
router.get('/situation', getSituation);

export default router;