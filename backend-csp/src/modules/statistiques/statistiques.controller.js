import * as statsService from './statistiques.service.js';

export const getDashboard = async (req, res, next) => {
  try {
    const stats = await statsService.getDashboardStats(req.user.schoolId, req.query.anneeScolaire || '2025-2026');
    res.json(stats);
  } catch (error) { next(error); }
};