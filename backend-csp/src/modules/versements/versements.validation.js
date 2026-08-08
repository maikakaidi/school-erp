import { z } from 'zod';

export const createVersementSchema = z.object({
  eleveId: z.string().uuid(),
  anneeScolaire: z.string(),
  tranche: z.number().int().min(1).max(3),
  montant: z.number().positive(),
  reduction: z.number().min(0).optional(),
  modePaiement: z.enum(['cash', 'bank', 'mobile']),
  commentaire: z.string().optional(),
});