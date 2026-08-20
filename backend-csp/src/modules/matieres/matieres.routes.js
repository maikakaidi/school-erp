import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import { getAll, getOne, create, update, softDelete, restore, getGroupes, createGroupe, deleteGroupe } from './matieres.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);
router.get('/groupes/all', getGroupes);
router.post('/groupes', createGroupe);
router.delete('/groupes/:id', deleteGroupe);

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/soft-delete', softDelete);
router.patch('/:id/restore', restore);
router.delete('/:id', softDelete);

export default router;