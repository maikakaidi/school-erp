import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import { getSettings, updateSettings, uploadLogo } from './settings.controller.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);
router.get('/', getSettings);
router.patch('/', updateSettings);
router.post('/upload-logo', upload.single('logo'), uploadLogo);

export default router;