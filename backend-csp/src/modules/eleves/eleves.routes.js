import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import { getAll, getOne, create, update, remove, exportExcel } from './eleves.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);

router.get('/export', exportExcel);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);       // plus de multer
router.put('/:id', update);
router.delete('/:id', remove);

export default router;