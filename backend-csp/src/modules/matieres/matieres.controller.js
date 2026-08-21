import * as matiereService from './matieres.service.js';
import { createMatiereSchema, updateMatiereSchema } from './matieres.validation.js';

export const getAll = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const data = await matiereService.getAllMatieres(req.user.schoolId, includeInactive);
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
    const result = await matiereService.updateMatiere(req.params.id, req.user.schoolId, validated);
    if (result.count === 0) return res.status(404).json({ message: 'Matière non trouvée' });
    res.json({ message: 'Matière mise à jour' });
  } catch (error) {
    if (error.name === 'ZodError') error.status = 400;
    if (error.code === 'P2002') { error.status = 409; error.message = 'Une matière avec ce libellé existe déjà'; }
    next(error);
  }
};

export const softDelete = async (req, res, next) => {
  try {
    await matiereService.softDeleteMatiere(req.params.id, req.user.schoolId);
    res.status(204).send();
  } catch (error) { next(error); }
};

export const restore = async (req, res, next) => {
  try {
    await matiereService.restoreMatiere(req.params.id, req.user.schoolId);
    res.json({ message: 'Matière restaurée' });
  } catch (error) { next(error); }
};

export const getGroupes = async (req, res, next) => {
  try {
    const data = await matiereService.getMatieresGroupes(req.user.schoolId);
    res.json(data);
  } catch (error) { next(error); }
};

export const createGroupe = async (req, res, next) => {
  try {
    const { nom } = req.body;
    const data = await matiereService.createMatiereGroupe(req.user.schoolId, nom);
    res.status(201).json(data);
  } catch (error) { next(error); }
};

export const deleteGroupe = async (req, res, next) => {
  try {
    await matiereService.deleteMatiereGroupe(req.params.id, req.user.schoolId);
    res.status(204).send();
  } catch (error) { next(error); }
};