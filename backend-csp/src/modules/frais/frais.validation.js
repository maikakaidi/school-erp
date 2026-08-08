import { z } from 'zod';

export const createFraisSchema = z.object({
  classeId: z.string().uuid(),
  anneeScolaire: z.string(),
  versement1: z.number().positive(),
  versement2: z.number().positive(),
  versement3: z.number().positive(),
});

export const updateFraisSchema = createFraisSchema.partial();