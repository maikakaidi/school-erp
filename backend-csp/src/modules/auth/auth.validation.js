import { z } from 'zod';
import { buildPasswordValidation } from '../../utils/passwordPolicy.js';

export const registerSchoolSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  password: buildPasswordValidation(z),
});
export const loginSchoolSchema = z.object({
  phone: z.string(),
  password: z.string(),
});
export const loginSuperAdminSchema = z.object({
  phone: z.string(),
  password: z.string(),
});
export const loginParentSchema = z.object({
  schoolPhone: z.string().min(8),
  phone: z.string().min(6),
  password: z.string(),
});
export const loginEnseignantSchema = z.object({
  schoolPhone: z.string().min(8),
  phone: z.string().min(6),
  password: z.string(),
});
export const loginEleveSchema = z.object({
  schoolPhone: z.string().min(8),
  matricule: z.string().min(1),
  password: z.string(),
});
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: buildPasswordValidation(z),
});
