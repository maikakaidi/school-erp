import prisma from '../../config/database.js';
import * as examenService from './examens.service.js';
import { createExamenSchema, addSalleSchema, addResultatSchema } from './examens.validation.js';

export const getAll = async (req, res, next) => {
  try {
    const examens = await examenService.getAllExamens(req.user.schoolId, req.query.anneeScolaire);
    res.json(examens);
  } catch (error) { next(error); }
};

export const getOne = async (req, res, next) => {
  try {
    const examen = await examenService.getExamenById(req.params.id, req.user.schoolId);
    if (!examen) return res.status(404).json({ message: 'Examen non trouvé' });
    res.json(examen);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const validated = createExamenSchema.parse(req.body);
    const examen = await examenService.createExamen(req.user.schoolId, validated);
    res.status(201).json(examen);
  } catch (error) { next(error); }
};

export const deleteExamen = async (req, res, next) => {
  try {
    await examenService.deleteExamen(req.params.id, req.user.schoolId);
    res.status(204).send();
  } catch (error) { next(error); }
};

export const addSalle = async (req, res, next) => {
  try {
    const validated = addSalleSchema.parse(req.body);
    const salle = await examenService.addSalle(req.user.schoolId, req.params.examenId, validated);
    res.json(salle);
  } catch (error) { next(error); }
};

export const addResultat = async (req, res, next) => {
  try {
    const validated = addResultatSchema.parse(req.body);
    const resultat = await examenService.addResultat(req.user.schoolId, req.params.examenId, validated);
    res.json(resultat);
  } catch (error) { next(error); }
};

export const getResultats = async (req, res, next) => {
  try {
    const resultats = await examenService.getResultats(req.user.schoolId, req.params.examenId);
    res.json(resultats);
  } catch (error) { next(error); }
};

export const repartition = async (req, res, next) => {
  try {
    const rep = await examenService.repartitionSalles(req.user.schoolId, req.params.examenId);
    res.json(rep);
  } catch (error) { next(error); }
};

export const getClassement = async (req, res, next) => {
  try {
    const classement = await examenService.getClassement(req.user.schoolId, req.params.examenId);
    res.json(classement);
  } catch (error) { next(error); }
};

export const exportClassementPDF = async (req, res, next) => {
  try {
    const pdfStream = await examenService.generateClassementPDF(req.user.schoolId, req.params.examenId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=classement_examen_${req.params.examenId}.pdf`);
    pdfStream.pipe(res);
  } catch (error) { next(error); }
};