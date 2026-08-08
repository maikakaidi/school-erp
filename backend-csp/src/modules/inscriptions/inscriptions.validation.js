import { z } from 'zod';

export const createInscriptionSchema = z.object({
  eleveId: z.string().uuid(),
  classeId: z.string().uuid(),
  anneeScolaire: z.string(),
  type: z.string().optional().default('Ordinaire'),
  reduction: z.number().min(0).max(100).optional().default(0),
});

export const updateInscriptionSchema = createInscriptionSchema.partial();