import express from 'express';
import { registerSchool, loginSchool, loginSuperAdmin, loginParent, refreshToken } from './auth.controller.js';
const router = express.Router();

/**
 * @swagger
 * /auth/register-school:
 *   post:
 *     summary: Inscription d'une nouvelle école (essai 14j)
 */
router.post('/register-school', registerSchool);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion école (téléphone + mot de passe)
 */
router.post('/login', loginSchool);
/**
 * @swagger
 * /auth/login-super-admin:
 *   post:
 *     summary: Connexion Super Admin
 */
router.post('/login-super-admin', loginSuperAdmin);
/**
 * @swagger
 * /auth/login-parent:
 *   post:
 *     summary: Connexion parent (téléphone école + téléphone parent + mot de passe)
 */
router.post('/login-parent', loginParent);
router.post('/refresh', refreshToken);

export default router;