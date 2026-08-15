import * as authService from './auth.service.js';
import jwt from 'jsonwebtoken';
import { registerSchoolSchema, loginSchoolSchema, loginSuperAdminSchema, loginParentSchema, loginEnseignantSchema, loginEleveSchema } from './auth.validation.js';

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
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    let newToken;
    if (decoded.actorType && decoded.schoolId) {
      newToken = jwt.sign(
        { schoolId: decoded.schoolId, actorType: decoded.actorType, actorId: decoded.actorId, role: decoded.role },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
    } else if (decoded.schoolId) {
      newToken = jwt.sign({ schoolId: decoded.schoolId }, process.env.JWT_SECRET, { expiresIn: '8h' });
    } else if (decoded.superAdminId) {
      newToken = jwt.sign({ superAdminId: decoded.superAdminId }, process.env.JWT_SECRET, { expiresIn: '8h' });
    } else throw new Error('Invalid refresh');
    res.json({ accessToken: newToken });
  } catch (error) { next({ status: 401, message: 'Refresh token invalide' }); }
};