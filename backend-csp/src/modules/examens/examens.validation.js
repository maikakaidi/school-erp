import { z } from 'zod';

export const createExamenSchema = z.object({
  nom: z.string().min(1),
  dateDebut: z.string().transform(str => new Date(str)),
  dateFin: z.string().transform(str => new Date(str)),
  classeId: z.string().uuid(),
  anneeScolaire: z.string(),
});

export const addSalleSchema = z.object({
  nomSalle: z.string(),
  capacite: z.union([z.number(), z.string()]).transform(val => {
    const num = Number(val);
    if (isNaN(num)) throw new Error('La capacité doit être un nombre');
    return num;
  }).pipe(z.number().int().positive()),
});

export const addResultatSchema = z.object({
  eleveId: z.string().uuid(),
  matiereId: z.string().uuid(),
  note: z.union([z.number(), z.string()]).transform(val => Number(val)).pipe(z.number().min(0).max(20)),
});