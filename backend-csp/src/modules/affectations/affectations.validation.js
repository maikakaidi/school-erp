import { z } from 'zod';

export const createAffectationSchema = z.object({
  enseignantId: z.string().min(1, 'Enseignant requis'),
  classeId: z.string().min(1, 'Classe requise'),
  matiereId: z.string().min(1, 'Matière requise'),
  isActive: z.boolean().optional().default(true),
});
