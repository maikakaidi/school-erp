import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date au format YYYY-MM-DD').optional();

export const createAnnonceSchema = z.object({
  titre: z.string().min(1, 'Le titre est requis').max(150),
  message: z.string().min(1, 'Le message est requis'),
  type: z.enum(['info', 'urgence', 'evenement', 'resultat']).optional(),
  cible: z.enum(['ecole', 'parents', 'enseignants', 'classe']).optional(),
  classeId: z.string().min(1).optional(),
  date: dateSchema,
});

export const updateAnnonceSchema = z.object({
  titre: z.string().min(1).max(150).optional(),
  message: z.string().min(1).optional(),
  type: z.enum(['info', 'urgence', 'evenement', 'resultat']).optional(),
  cible: z.enum(['ecole', 'parents', 'enseignants', 'classe']).optional(),
  classeId: z.string().min(1).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  date: dateSchema,
});
