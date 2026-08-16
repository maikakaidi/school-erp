import * as exportService from './export.service.js';
import { sendExcel } from '../../utils/excel.export.js';

export const annualExport = async (req, res, next) => {
  try {
    const { anneeScolaire } = req.query;
    if (!anneeScolaire) return res.status(400).json({ message: 'anneeScolaire requise (format YYYY-YYYY)' });
    const sheets = await exportService.generateAnnualExport(req.user.schoolId, anneeScolaire);
    const totalRows = sheets.reduce((sum, s) => sum + s.rows.length, 0);
    sendExcel(res, sheets, `export_annuel_${anneeScolaire}.xlsx`);
  } catch (error) { next(error); }
};
