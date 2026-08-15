import * as affectationService from './affectations.service.js';
import { createAffectationSchema } from './affectations.validation.js';

export const getAll = async (req, res, next) => {
  try {
    const { enseignantId } = req.query;
    const affectations = await affectationService.getAllAffectations(req.user.schoolId, { enseignantId });
    res.json({ affectations, total: affectations.length });
  } catch (error) { next(error); }
};

export const getOne = async (req, res, next) => {
  try {
    const affectation = await affectationService.getAffectationById(req.user.schoolId, req.params.id);
    if (!affectation) return res.status(404).json({ message: 'Affectation non trouvée' });
    res.json(affectation);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const data = createAffectationSchema.parse(req.body);
    const affectation = await affectationService.createAffectation(req.user.schoolId, data);
    res.status(201).json(affectation);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const data = createAffectationSchema.partial().parse(req.body);
    await affectationService.updateAffectation(req.user.schoolId, req.params.id, data);
    res.json({ message: 'Mis à jour' });
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await affectationService.deleteAffectation(req.user.schoolId, req.params.id);
    res.status(204).send();
  } catch (error) { next(error); }
};
