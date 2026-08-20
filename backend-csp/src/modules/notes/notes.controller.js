import * as noteService from './notes.service.js';
import { upsertNoteSchema } from './notes.validation.js';
import { sendExcel } from '../../utils/excel.export.js';
import { resolveAcademicYear } from '../academic-years/academicYears.service.js';

export const upsert = async (req, res, next) => {
  try {
    const validated = upsertNoteSchema.parse(req.body);
    const note = await noteService.upsertNote(req.user.schoolId, validated);
    res.json(note);
  } catch (error) { next(error); }
};

export const getByEleve = async (req, res, next) => {
  try {
    const { eleveId, semestre, anneeScolaire } = req.query;
    const year = await resolveAcademicYear(req.user.schoolId, anneeScolaire);
    const data = await noteService.getNotesByEleve(req.user.schoolId, eleveId, parseInt(semestre), year);
    res.json(data);
  } catch (error) { next(error); }
};

export const getByClasse = async (req, res, next) => {
  try {
    const { classeId, matiereId, semestre, anneeScolaire } = req.query;
    if (!classeId || !matiereId) return res.status(400).json({ message: 'classeId et matiereId requis' });
    const year = await resolveAcademicYear(req.user.schoolId, anneeScolaire);
    const data = await noteService.getNotesByClasse(req.user.schoolId, classeId, matiereId, parseInt(semestre), year);
    res.json(data);
  } catch (error) { next(error); }
};

export const exportExcel = async (req, res, next) => {
  try {
    const { classeId, semestre, anneeScolaire } = req.query;
    if (!classeId) return res.status(400).json({ message: 'classeId requis' });
    const year = await resolveAcademicYear(req.user.schoolId, anneeScolaire);
    const rows = await noteService.exportNotes(req.user.schoolId, classeId, parseInt(semestre) || 1, year);
    sendExcel(res, rows, 'notes.xlsx');
  } catch (error) { next(error); }
};