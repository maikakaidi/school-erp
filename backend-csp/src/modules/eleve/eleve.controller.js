import * as eleveService from './eleve.service.js';

export const getMe = async (req, res, next) => {
  try {
    const result = await eleveService.getProfile(req.user.schoolId, req.user.eleveId);
    res.json(result);
  } catch (error) { next(error); }
};

export const getDashboard = async (req, res, next) => {
  try {
    const { anneeScolaire } = req.query;
    const data = await eleveService.getDashboard(req.user.schoolId, req.user.eleveId, anneeScolaire);
    res.json(data);
  } catch (error) { next(error); }
};

export const getNotes = async (req, res, next) => {
  try {
    const { anneeScolaire } = req.query;
    const data = await eleveService.getNotes(req.user.schoolId, req.user.eleveId, anneeScolaire);
    res.json(data);
  } catch (error) { next(error); }
};

export const getEmploiDuTemps = async (req, res, next) => {
  try {
    const { mois, annee } = req.query;
    const data = await eleveService.getEmploiDuTemps(req.user.schoolId, req.user.eleveId, mois, annee);
    res.json(data);
  } catch (error) { next(error); }
};

export const getAbsences = async (req, res, next) => {
  try {
    const { anneeScolaire } = req.query;
    const data = await eleveService.getAbsences(req.user.schoolId, req.user.eleveId, anneeScolaire);
    res.json(data);
  } catch (error) { next(error); }
};

export const getPayments = async (req, res, next) => {
  try {
    const { anneeScolaire } = req.query;
    const data = await eleveService.getPayments(req.user.schoolId, req.user.eleveId, anneeScolaire);
    res.json(data);
  } catch (error) { next(error); }
};
