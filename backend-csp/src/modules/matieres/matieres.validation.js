import { z } from 'zod';

export const createMatiereSchema = z.object({
  libelle: z.string().min(1),
  code: z.string().optional(),
  type: z.string().optional(),
  groupeId: z.string().uuid().optional(),
});

export const updateMatiereSchema = createMatiereSchema.partial();