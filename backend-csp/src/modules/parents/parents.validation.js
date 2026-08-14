import { z } from 'zod';

export const createParentSchema = z.object({
  nom: z.string().min(2),
  telephone: z.string().min(6),
  password: z.string().min(6),
  email: z.string().email().optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
  eleveIds: z.array(z.string()).optional(),
});

export const updateParentSchema = z.object({
  nom: z.string().min(2).optional(),
  telephone: z.string().min(6).optional(),
  password: z.string().min(6).optional(),
  email: z.string().email().optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  eleveIds: z.array(z.string()).optional(),
});
