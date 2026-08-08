import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import { getAll, getByClasse, upsert, remove } from './frais.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);
router.get('/', getAll);
router.get('/classe', getByClasse);
router.post('/', upsert);
router.delete('/:id', remove);

export default router;