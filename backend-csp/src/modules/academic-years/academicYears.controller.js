import * as academicYearService from './academicYears.service.js';

export const getYears = async (req, res, next) => {
  try {
    const years = await academicYearService.getYears(req.user.schoolId);
    res.json(years);
  } catch (error) { next(error); }
};

export const getCurrentYear = async (req, res, next) => {
  try {
    const year = await academicYearService.getCurrentYear(req.user.schoolId);
    res.json(year || { name: '2025-2026', isCurrent: true });
  } catch (error) { next(error); }
};

export const createYear = async (req, res, next) => {
  try {
    const { name, startDate, endDate } = req.body;
    const year = await academicYearService.createYear(req.user.schoolId, { name, startDate, endDate });
    res.status(201).json(year);
  } catch (error) { next(error); }
};

export const setCurrent = async (req, res, next) => {
  try {
    const result = await academicYearService.setCurrent(req.user.schoolId, req.body.yearId);
    res.json({ message: `Année ${result.name} définie comme courante`, year: result });
  } catch (error) { next(error); }
};

export const closeYear = async (req, res, next) => {
  try {
    const year = await academicYearService.closeYear(req.user.schoolId, req.body.yearId);
    res.json({ message: `Année ${year.name} archivée`, year });
  } catch (error) { next(error); }
};

export const copyYearData = async (req, res, next) => {
  try {
    const { sourceYearId, targetYearName } = req.body;
    const result = await academicYearService.copyYearData(req.user.schoolId, sourceYearId, targetYearName);
    res.json({ message: `Données copiées de ${result.sourceYear} vers ${result.targetYear}`, result });
  } catch (error) { next(error); }
};

export const updateYear = async (req, res, next) => {
  try {
    const year = await academicYearService.updateYear(req.user.schoolId, req.params.id, req.body);
    res.json(year);
  } catch (error) { next(error); }
};

export const deleteYear = async (req, res, next) => {
  try {
    await academicYearService.deleteYear(req.user.schoolId, req.params.id);
    res.json({ message: 'Année supprimée' });
  } catch (error) { next(error); }
};
