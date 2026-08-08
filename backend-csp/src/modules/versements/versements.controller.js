import * as versementService from './versements.service.js';
import { createVersementSchema } from './versements.validation.js';
import { sendExcel } from '../../utils/excel.export.js';

export const create = async (req, res, next) => {
  try {
    const validated = createVersementSchema.parse(req.body);
    const versement = await versementService.createVersement(req.user.schoolId, validated);
    res.status(201).json({ message: 'Versement enregistré', versement });
  } catch (error) { next(error); }
};

export const getByEleve = async (req, res, next) => {
  try {
    const { eleveId, anneeScolaire } = req.query;
    if (!eleveId) return res.status(400).json({ message: 'eleveId requis' });
    const versements = await versementService.getVersementsByEleve(req.user.schoolId, eleveId, anneeScolaire);
    res.json(versements);
  } catch (error) { next(error); }
};

export const getSituation = async (req, res, next) => {
  try {
    const { eleveId, anneeScolaire, fraisTotal } = req.query;
    if (!eleveId) return res.status(400).json({ message: 'eleveId requis' });
    const situation = await versementService.getSituationFinanciere(
      req.user.schoolId,
      eleveId,
      anneeScolaire,
      parseFloat(fraisTotal) || 300000
    );
    res.json(situation);
  } catch (error) { next(error); }
};

export const exportExcel = async (req, res, next) => {
  try {
    const { anneeScolaire } = req.query;
    const rows = await versementService.exportVersements(req.user.schoolId, anneeScolaire);
    sendExcel(res, rows, 'versements.xlsx');
  } catch (error) { next(error); }
};