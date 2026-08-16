import * as authService from './auth.service.js';
import { registerSchoolSchema, loginSchoolSchema, loginSuperAdminSchema, loginParentSchema, loginEnseignantSchema, loginEleveSchema, changePasswordSchema } from './auth.validation.js';

export const registerSchool = async (req, res, next) => {
  try {
    const data = registerSchoolSchema.parse(req.body);
    const result = await authService.registerSchool(data);
    res.status(201).json(result);
  } catch (error) { next(error); }
};

export const loginSchool = async (req, res, next) => {
  try {
    const { phone, password } = loginSchoolSchema.parse(req.body);
    const result = await authService.loginSchool(phone, password);
    res.json(result);
  } catch (error) { next({ status: 401, message: error.message }); }
};

export const loginSuperAdmin = async (req, res, next) => {
  try {
    const { phone, password } = loginSuperAdminSchema.parse(req.body);
    const result = await authService.loginSuperAdmin(phone, password);
    res.json(result);
  } catch (error) { next({ status: 401, message: error.message }); }
};

export const loginParent = async (req, res, next) => {
  try {
    const { schoolPhone, phone, password } = loginParentSchema.parse(req.body);
    const result = await authService.loginParent(schoolPhone, phone, password);
    res.json(result);
  } catch (error) { next({ status: 401, message: error.message }); }
};

export const loginEnseignant = async (req, res, next) => {
  try {
    const { schoolPhone, phone, password } = loginEnseignantSchema.parse(req.body);
    const result = await authService.loginEnseignant(schoolPhone, phone, password);
    res.json(result);
  } catch (error) { next({ status: 401, message: error.message }); }
};

export const loginEleve = async (req, res, next) => {
  try {
    const { schoolPhone, matricule, password } = loginEleveSchema.parse(req.body);
    const result = await authService.loginEleve(schoolPhone, matricule, password);
    res.json(result);
  } catch (error) { next({ status: 401, message: error.message }); }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new Error('Refresh token requis');
    const result = await authService.refreshTokens(refreshToken);
    res.json(result);
  } catch (error) { next({ status: 401, message: 'Refresh token invalide ou expiré' }); }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new Error('Refresh token requis');
    await authService.logoutSession(refreshToken);
    res.json({ message: 'Déconnecté avec succès' });
  } catch (error) { next({ status: 401, message: 'Refresh token invalide ou expiré' }); }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await authService.changePassword(req, currentPassword, newPassword);
    res.json({ message: 'Mot de passe modifié avec succès. Veuillez vous reconnecter.' });
  } catch (error) { next(error); }
};
