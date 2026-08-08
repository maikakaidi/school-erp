import * as enseignantService from './enseignants.service.js';
import { createEnseignantSchema, updateEnseignantSchema } from './enseignants.validation.js';
import { sendExcel } from '../../utils/excel.export.js';

export const getAll = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await enseignantService.getAllEnseignants(
      req.user.schoolId,
      parseInt(page) || 1,
      parseInt(limit) || 20,
      search || ''
    );
    res.json(result);
  } catch (error) { next(error); }
};

export const getOne = async (req, res, next) => {
  try {
    const enseignant = await enseignantService.getEnseignantById(req.params.id, req.user.schoolId);
    if (!enseignant) return res.status(404).json({ message: 'Enseignant non trouvé' });
    res.json(enseignant);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const validated = createEnseignantSchema.parse(req.body);
    console.log('✅ Données validées (création) :', JSON.stringify(validated, null, 2));
    const enseignant = await enseignantService.createEnseignant(req.user.schoolId, validated);
    res.status(201).json(enseignant);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const validated = updateEnseignantSchema.parse(req.body);
    console.log('✅ Données validées (mise à jour) :', JSON.stringify(validated, null, 2));
    await enseignantService.updateEnseignant(req.params.id, req.user.schoolId, validated);
    res.json({ message: 'Mis à jour' });
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await enseignantService.deleteEnseignant(req.params.id, req.user.schoolId);
    res.status(204).send();
  } catch (error) { next(error); }
};

export const exportExcel = async (req, res, next) => {
  try {
    const rows = await enseignantService.exportEnseignants(req.user.schoolId);
    sendExcel(res, rows, 'enseignants.xlsx');
  } catch (error) { next(error); }
};