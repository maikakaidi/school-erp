import { z } from 'zod';
import { buildPasswordValidation } from '../../utils/passwordPolicy.js';

export const renewSchema = z.object({
  days: z.number().int().min(1).max(3650).default(365),
});

export const addDaysSchema = z.object({
  days: z.number().int().min(1).max(365),
});

export const resetPasswordSchema = z.object({
  newPassword: buildPasswordValidation(z),
});
