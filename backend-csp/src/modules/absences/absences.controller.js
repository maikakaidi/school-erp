import * as absenceService from './absences.service.js';
import { createAbsenceSchema, bulkCreateAbsencesSchema, updateAbsenceSchema } from './absences.validation.js';
import { sendExcel } from '../../utils/excel.export.js';

const parseQuery = (schema, query) => {
  try {
    return schema.parse(query);
  } catch (error) {
    error.status = 400;
    throw error;
  }
};

export const getAll = async (req, res, next) => {
  try {
    const { anneeScolaire, dateDebut, dateFin, classeId, eleveId, type, search, page, limit } = req.query;
    const data = await absenceService.getAllAbsences(req.user.schoolId, {
      anneeScolaire,
      dateDebut,
      dateFin,
      classeId,
      eleveId,
      type,
      search,
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 20, 100),
    });
    res.json(data);
  } catch (error) { next(error); }
};

export const getOne = async (req, res, next) => {
  try {
    const absence = await absenceService.getAbsenceById(req.user.schoolId, req.params.id);
    if (!absence) return res.status(404).json({ message: 'Absence non trouvée' });
    res.json(absence);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const data = createAbsenceSchema.parse(req.body);
    const absence = await absenceService.createAbsence(req.user.schoolId, data);
    res.status(201).json(absence);
  } catch (error) { next(error); }
};

export const createBulk = async (req, res, next) => {
  try {
    const data = bulkCreateAbsencesSchema.parse(req.body);
    const result = await absenceService.bulkCreateAbsences(req.user.schoolId, data);
    res.status(201).json(result);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const data = updateAbsenceSchema.parse(req.body);
    const absence = await absenceService.updateAbsence(req.user.schoolId, req.params.id, data);
    res.json(absence);
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    const result = await absenceService.deleteAbsence(req.user.schoolId, req.params.id);
    if (result.count === 0) return res.status(404).json({ message: 'Absence non trouvée' });
    res.json({ message: 'Absence supprimée' });
  } catch (error) { next(error); }
};

export const exportExcel = async (req, res, next) => {
  try {
    const { anneeScolaire, dateDebut, dateFin, classeId, type } = req.query;
    const rows = await absenceService.exportAbsences(req.user.schoolId, { anneeScolaire, dateDebut, dateFin, classeId, type });
    sendExcel(res, rows, 'absences.xlsx');
  } catch (error) { next(error); }
};
