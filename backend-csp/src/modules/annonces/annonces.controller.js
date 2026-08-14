import * as annonceService from './annonces.service.js';
import { createAnnonceSchema, updateAnnonceSchema } from './annonces.validation.js';

export const getAll = async (req, res, next) => {
  try {
    const { cible, page, limit } = req.query;
    const data = await annonceService.getAllAnnonces(req.user.schoolId, {
      cible: cible || undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    res.json(data);
  } catch (error) { next(error); }
};

export const getOne = async (req, res, next) => {
  try {
    const annonce = await annonceService.getAnnonceById(req.user.schoolId, req.params.id);
    if (!annonce) return res.status(404).json({ message: 'Annonce non trouvée' });
    res.json(annonce);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const data = createAnnonceSchema.parse(req.body);
    const annonce = await annonceService.createAnnonce(req.user.schoolId, data);
    res.status(201).json(annonce);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const data = updateAnnonceSchema.parse(req.body);
    const annonce = await annonceService.updateAnnonce(req.user.schoolId, req.params.id, data);
    res.json(annonce);
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    const result = await annonceService.deleteAnnonce(req.user.schoolId, req.params.id);
    if (result.count === 0) return res.status(404).json({ message: 'Annonce non trouvée' });
    res.json({ message: 'Annonce supprimée' });
  } catch (error) { next(error); }
};
