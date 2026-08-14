import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import { getAll, getOne, create, createBulk, update, remove, exportExcel } from './absences.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);

router.get('/', getAll);
router.get('/export', exportExcel);
router.post('/bulk', createBulk);
router.post('/', create);
router.get('/:id', getOne);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
