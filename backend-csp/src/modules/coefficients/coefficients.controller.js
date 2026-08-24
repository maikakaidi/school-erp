import * as coeffService from './coefficients.service.js';
import { createCoefficientSchema } from './coefficients.validation.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await coeffService.getAllCoefficients(req.user.schoolId, req.query.anneeScolaire);
    res.json(data);
  } catch (error) { next(error); }
};

export const getByClasse = async (req, res, next) => {
  try {
    const { classeId, anneeScolaire } = req.query;
    const data = await coeffService.getCoefficientsByClasse(req.user.schoolId, classeId, anneeScolaire);
    res.json(data);
  } catch (error) { next(error); }
};

export const upsert = async (req, res, next) => {
  try {
    const validated = createCoefficientSchema.parse(req.body);
    const data = validated.coefficient === null
      ? await coeffService.clearCoefficient(req.user.schoolId, validated)
      : await coeffService.upsertCoefficient(req.user.schoolId, validated);
    res.json(data);
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await coeffService.deleteCoefficient(req.params.id, req.user.schoolId);
    res.status(204).send();
  } catch (error) { next(error); }
};