import { z } from 'zod';

export const createEnseignantSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  telephone: z.string().min(1, 'Téléphone requis'),
  email: z.string().email().optional(),
  specialite: z.string().optional(),
  estVacataire: z.boolean().optional().default(false),
  tauxHoraire: z.number().positive().optional(),
  salaireFixe: z.number().positive().optional(),
  anciennete: z.number().int().min(0).optional(),
  dateEmbauche: z.string().transform(str => new Date(str)).optional(),
});

export const updateEnseignantSchema = createEnseignantSchema.partial();