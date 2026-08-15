import { z } from 'zod';

export const saveNotesSchema = z.object({
  classeId: z.string().min(1, 'Classe requise'),
  matiereId: z.string().min(1, 'Matière requise'),
  semestre: z.preprocess((v) => Number(v), z.number().int().min(1).max(2)),
  anneeScolaire: z.string().min(1, 'Année scolaire requise'),
  notes: z.array(
    z.object({
      eleveId: z.string().min(1),
      devoir: z.number().min(0).max(20).nullable().optional(),
      composition: z.number().min(0).max(20).nullable().optional(),
      appreciation: z.string().max(300).nullable().optional(),
    })
  ).min(1, 'Au moins une note'),
});

export const createAbsenceSchema = z.object({
  eleveId: z.string().min(1, 'Élève requis'),
  classeId: z.string().optional(),
  matiereId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date au format YYYY-MM-DD'),
  type: z.enum(['absence', 'retard']),
  motif: z.string().max(300).nullable().optional(),
});
