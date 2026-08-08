import { z } from 'zod';

export const createHoraireSchema = z.object({
  enseignantId: z.string().uuid(),
  classeId: z.string().uuid(),
  matiereId: z.string().uuid(),
  jour: z.string(),
  heureDebut: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  heureFin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  mois: z.preprocess((val) => Number(val), z.number().int().min(1).max(12)),
  annee: z.preprocess((val) => Number(val), z.number().int().min(2000).max(2100)),
});