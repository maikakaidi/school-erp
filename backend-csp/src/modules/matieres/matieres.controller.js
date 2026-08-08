import * as matiereService from './matieres.service.js';
import { createMatiereSchema, updateMatiereSchema } from './matieres.validation.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await matiereService.getAllMatieres(req.user.schoolId);
    res.json(data);
  } catch (error) { next(error); }
};

export const getOne = async (req, res, next) => {
  try {
    const data = await matiereService.getMatiereById(req.params.id, req.user.schoolId);
    if (!data) return res.status(404).json({ message: 'Matière non trouvée' });
    res.json(data);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const validated = createMatiereSchema.parse(req.body);
    const data = await matiereService.createMatiere(req.user.schoolId, validated);
    res.status(201).json(data);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const validated = updateMatiereSchema.parse(req.body);
    await matiereService.updateMatiere(req.params.id, req.user.schoolId, validated);
    res.json({ message: 'Matière mise à jour' });
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await matiereService.deleteMatiere(req.params.id, req.user.schoolId);
    res.status(204).send();
  } catch (error) { next(error); }
};