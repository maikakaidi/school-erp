import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import * as controller from './academicYears.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);

router.get('/', controller.getYears);
router.get('/current', controller.getCurrentYear);
router.post('/', controller.createYear);
router.post('/set-current', controller.setCurrent);
router.post('/close', controller.closeYear);
router.post('/copy', controller.copyYearData);

export default router;
