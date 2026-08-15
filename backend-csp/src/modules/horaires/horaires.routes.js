import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import { getAll, getByEnseignant, getByClasse, getByEleve, create, update, remove } from './horaires.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);
router.get('/', getAll);
router.get('/enseignant', getByEnseignant);
router.get('/classe', getByClasse);
router.get('/eleve', getByEleve);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
export default router;