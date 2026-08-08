import * as schoolService from './schools.service.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';

export const getProfile = async (req, res, next) => {
  try {
    const profile = await schoolService.getSchoolProfile(req.user.schoolId);
    res.json(profile);
  } catch (error) { next(error); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updated = await schoolService.updateSchoolProfile(req.user.schoolId, req.body);
    res.json(updated);
  } catch (error) { next(error); }
};

export const updateSettings = async (req, res, next) => {
  try {
    const settings = await schoolService.updateSchoolSettings(req.user.schoolId, req.body);
    res.json(settings);
  } catch (error) { next(error); }
};