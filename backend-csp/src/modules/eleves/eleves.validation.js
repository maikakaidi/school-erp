import { z } from 'zod';

export const createEleveSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  sexe: z.enum(['M', 'F']),
  dateNaissance: z.string().transform(str => new Date(str)),
  lieuNaissance: z.string(),
  nationalite: z.string(),
  telephone: z.string().optional(),
  nomParent: z.string(),
  adresseParent: z.string(),
  telParent: z.string(),
  photoUrl: z.string().url().optional(),
});

export const updateEleveSchema = createEleveSchema.partial();