import { z } from 'zod';

export const createCoefficientSchema = z.object({
  classeId: z.string().uuid(),
  matiereId: z.string().uuid(),
  coefficient: z.preprocess(
    (val) => (val === null || val === '' ? undefined : Number(val)),
    z.number().int().positive()
  ),
  anneeScolaire: z.string(),
});

export const updateCoefficientSchema = createCoefficientSchema.partial();