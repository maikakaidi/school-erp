import * as rapportsService from './rapports.service.js';
import { sendExcel } from '../../utils/excel.export.js';
import { resolveAcademicYear } from '../academic-years/academicYears.service.js';

export const getAssiduite = async (req, res, next) => {
  try {
    const { anneeScolaire, classeId } = req.query;
    const year = await resolveAcademicYear(req.user.schoolId, anneeScolaire);
    const data = await rapportsService.getAssiduiteParClasse(req.user.schoolId, year, classeId || null);
    res.json(data);
  } catch (error) { next(error); }
};

export const getAssiduiteExcel = async (req, res, next) => {
  try {
    const { anneeScolaire, classeId } = req.query;
    const year = await resolveAcademicYear(req.user.schoolId, anneeScolaire);
    const data = await rapportsService.getAssiduiteParClasse(req.user.schoolId, year, classeId || null);
    const rows = data.rows.map((r) => ({
      'Classe': r.classe,
      'Effectif': r.effectif,
      'Absences': r.absences,
      'Retards': r.retards,
      'Taux abs./élève': r.tauxAbsence,
    }));
    sendExcel(res, [{ sheetName: 'Assiduité', rows }], `assiduite_${year}.xlsx`);
  } catch (error) { next(error); }
};

export const getAssiduitePdf = async (req, res, next) => {
  try {
    const { anneeScolaire, classeId } = req.query;
    const year = await resolveAcademicYear(req.user.schoolId, anneeScolaire);
    const stream = await rapportsService.generateAssiduitePDF(req.user.schoolId, year, classeId || null);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="assiduite_${year}.pdf"`);
    stream.pipe(res);
  } catch (error) { next(error); }
};

export const getPaiements = async (req, res, next) => {
  try {
    const { anneeScolaire } = req.query;
    const year = await resolveAcademicYear(req.user.schoolId, anneeScolaire);
    const data = await rapportsService.getPaiementsEnRetard(req.user.schoolId, year);
    res.json(data);
  } catch (error) { next(error); }
};

export const getPaiementsExcel = async (req, res, next) => {
  try {
    const { anneeScolaire } = req.query;
    const year = await resolveAcademicYear(req.user.schoolId, anneeScolaire);
    const data = await rapportsService.getPaiementsEnRetard(req.user.schoolId, year);
    const rows = data.rows.map((r) => ({
      'Matricule': r.matricule,
      'Élève': r.eleve,
      'Classe': r.classe,
      'Frais (FCFA)': r.fraisTotal,
      'Payé (FCFA)': r.totalPaye,
      'Reste (FCFA)': r.reste,
    }));
    sendExcel(res, [{ sheetName: 'Paiements en retard', rows }], `paiements_retard_${year}.xlsx`);
  } catch (error) { next(error); }
};

export const getPaiementsPdf = async (req, res, next) => {
  try {
    const { anneeScolaire } = req.query;
    const year = await resolveAcademicYear(req.user.schoolId, anneeScolaire);
    const stream = await rapportsService.generatePaiementsPDF(req.user.schoolId, year);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="paiements_retard_${year}.pdf"`);
    stream.pipe(res);
  } catch (error) { next(error); }
};
