import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import { generate, getClassement, generateAllBulletins } from './bulletins.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);
router.get('/generate', generate);
router.get('/classement', getClassement);
router.get('/classe/:classeId', generateAllBulletins);
export default router;