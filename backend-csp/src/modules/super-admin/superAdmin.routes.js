import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSuperAdmin } from '../../middlewares/superAdmin.middleware.js';
import * as saController from './superAdmin.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { renewSchema, addDaysSchema, resetPasswordSchema } from './superAdmin.validation.js';

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.get('/schools', saController.getAllSchools);
router.get('/dashboard', saController.getDashboardStats);
router.patch('/activate/:id', saController.activateSchool);
router.patch('/deactivate/:id', saController.deactivateSchool);
router.patch('/renew/:id', validate(renewSchema), saController.renewSchool);
router.patch('/add-days/:id', validate(addDaysSchema), saController.addDays);
router.patch('/reset-password/:id', validate(resetPasswordSchema), saController.resetSchoolPassword);
router.delete('/delete/:id', saController.deleteSchool);

export default router;
