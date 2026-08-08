import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import { getDashboard } from './statistiques.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);
router.get('/dashboard', getDashboard);
export default router;