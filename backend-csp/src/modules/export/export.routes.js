import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import { annualExport } from './export.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);

router.get('/annual', annualExport);

export default router;
