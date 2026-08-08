import { z } from 'zod';

export const upsertNoteSchema = z.object({
  eleveId: z.string().uuid(),
  matiereId: z.string().uuid(),
  classeId: z.string().uuid(),
  semestre: z.number().int().min(1).max(2),
  anneeScolaire: z.string(),
  devoir: z.number().min(0).max(20).optional(),
  composition: z.number().min(0).max(20).optional(),
  appreciation: z.string().optional(),
});