import { z } from 'zod';

export const renewSchema = z.object({
  days: z.number().int().min(1).max(3650).default(365),
});

export const addDaysSchema = z.object({
  days: z.number().int().min(1).max(365),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});
