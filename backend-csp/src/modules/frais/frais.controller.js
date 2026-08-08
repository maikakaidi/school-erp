import * as fraisService from './frais.service.js';
import { createFraisSchema, updateFraisSchema } from './frais.validation.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await fraisService.getAllFrais(req.user.schoolId, req.query.anneeScolaire);
    res.json(data);
  } catch (error) { next(error); }
};

export const getByClasse = async (req, res, next) => {
  try {
    const { classeId, anneeScolaire } = req.query;
    const data = await fraisService.getFraisByClasse(req.user.schoolId, classeId, anneeScolaire);
    if (!data) return res.status(404).json({ message: 'Frais non trouvés' });
    res.json(data);
  } catch (error) { next(error); }
};

export const upsert = async (req, res, next) => {
  try {
    const validated = createFraisSchema.parse(req.body);
    const data = await fraisService.upsertFrais(req.user.schoolId, validated);
    res.json({ message: 'Frais enregistrés', data });
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await fraisService.deleteFrais(req.params.id, req.user.schoolId);
    res.status(204).send();
  } catch (error) { next(error); }
};