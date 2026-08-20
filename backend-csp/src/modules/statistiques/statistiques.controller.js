import * as statsService from './statistiques.service.js';
import { resolveAcademicYear } from '../academic-years/academicYears.service.js';

export const getDashboard = async (req, res, next) => {
  try {
    const year = await resolveAcademicYear(req.user.schoolId, req.query.anneeScolaire);
    const stats = await statsService.getDashboardStats(req.user.schoolId, year);
    res.json(stats);
  } catch (error) { next(error); }
};