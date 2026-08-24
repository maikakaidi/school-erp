import { z } from 'zod';

export const createCoefficientSchema = z.object({
  classeId: z.string().uuid(),
  matiereId: z.string().uuid(),
  // null / '' = demande explicite de suppression du coefficient (« — »).
  // Champ absent => preprocess reçoit undefined => Number(undefined)=NaN => rejeté
  // (un champ absent n'est jamais assimilé à null).
  coefficient: z.preprocess(
    (val) => (val === null || val === '' ? null : Number(val)),
    z.union([z.number().int().positive(), z.null()])
  ),
  anneeScolaire: z.string(),
});

export const updateCoefficientSchema = createCoefficientSchema.partial();