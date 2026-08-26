import * as parentsService from './parents.service.js';
import { createParentSchema, updateParentSchema } from './parents.validation.js';

export const getAll = async (req, res, next) => {
  try {
    const { search, anneeScolaire } = req.query;
    const parents = await parentsService.getAllParents(req.user.schoolId, { search, anneeScolaire });
    res.json(parents);
  } catch (error) { next(error); }
};

export const getOne = async (req, res, next) => {
  try {
    const parent = await parentsService.getParentById(req.user.schoolId, req.params.id);
    if (!parent) return res.status(404).json({ message: 'Parent non trouvé' });
    res.json(parent);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const data = createParentSchema.parse(req.body);
    const parent = await parentsService.createParent(req.user.schoolId, data);
    res.status(201).json(parent);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const data = updateParentSchema.parse(req.body);
    const parent = await parentsService.updateParent(req.user.schoolId, req.params.id, data);
    res.json(parent);
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    const result = await parentsService.deleteParent(req.user.schoolId, req.params.id);
    if (result.count === 0) return res.status(404).json({ message: 'Parent non trouvé' });
    res.json({ message: 'Parent supprimé' });
  } catch (error) { next(error); }
};
