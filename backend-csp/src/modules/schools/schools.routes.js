import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import { getProfile, updateProfile, updateSettings } from './schools.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.patch('/settings', updateSettings);
export default router;