import * as inscriptionService from './inscriptions.service.js';
import { createInscriptionSchema, updateInscriptionSchema } from './inscriptions.validation.js';

export const getAll = async (req, res, next) => {
  try {
    const inscriptions = await inscriptionService.getAllInscriptions(
      req.user.schoolId,
      req.query.anneeScolaire
    );
    res.json(inscriptions);
  } catch (error) { next(error); }
};

export const getOne = async (req, res, next) => {
  try {
    const inscription = await inscriptionService.getInscriptionById(req.params.id, req.user.schoolId);
    if (!inscription) return res.status(404).json({ message: 'Inscription non trouvée' });
    res.json(inscription);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const validated = createInscriptionSchema.parse(req.body);
    const inscription = await inscriptionService.createInscription(req.user.schoolId, validated);
    res.status(201).json(inscription);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const validated = updateInscriptionSchema.parse(req.body);
    await inscriptionService.updateInscription(req.params.id, req.user.schoolId, validated);
    res.json({ message: 'Inscription mise à jour' });
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await inscriptionService.deleteInscription(req.params.id, req.user.schoolId);
    res.status(204).send();
  } catch (error) { next(error); }
};