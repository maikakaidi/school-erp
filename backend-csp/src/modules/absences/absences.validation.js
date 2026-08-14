import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date au format YYYY-MM-DD');

export const createAbsenceSchema = z.object({
  eleveId: z.string().min(1),
  classeId: z.string().min(1).optional(),
  matiereId: z.string().min(1).optional(),
  date: dateSchema,
  type: z.enum(['absence', 'retard']),
  motif: z.string().optional().or(z.literal('')),
  justifie: z.boolean().optional(),
  statutJustificatif: z.enum(['non_justifie', 'en_attente', 'justifie']).optional(),
  enregistrePar: z.string().optional(),
});

export const bulkCreateAbsencesSchema = z.object({
  date: dateSchema,
  type: z.enum(['absence', 'retard']),
  classeId: z.string().min(1),
  matiereId: z.string().min(1).optional(),
  eleveIds: z.array(z.string().min(1)).min(1),
  motif: z.string().optional().or(z.literal('')),
  justifie: z.boolean().optional(),
  enregistrePar: z.string().optional(),
});

export const updateAbsenceSchema = z.object({
  eleveId: z.string().min(1).optional(),
  classeId: z.string().min(1).optional(),
  matiereId: z.string().min(1).optional().or(z.literal('')),
  date: dateSchema.optional(),
  type: z.enum(['absence', 'retard']).optional(),
  motif: z.string().optional(),
  justifie: z.boolean().optional(),
  statutJustificatif: z.enum(['non_justifie', 'en_attente', 'justifie']).optional(),
});
