import { z } from 'zod';

export const createMatiereSchema = z.object({
  libelle: z.string().min(1),
  code: z.string().optional(),
  type: z.string().optional(),
  groupeId: z.string().uuid().optional(),
});

// UPDATE : tolère explicitement groupeId null (une matière peut ne faire
// partie d'aucun groupe ; représentation canonique = NULL en base,
// cf. deleteMatiereGroupe qui écrit groupeId: null).
// CREATE reste strict : il n'accepte que l'absence du champ.
export const updateMatiereSchema = createMatiereSchema
  .extend({ groupeId: z.string().uuid().nullish() })
  .partial();