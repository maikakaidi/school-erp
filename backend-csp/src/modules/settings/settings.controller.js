import * as settingsService from './settings.service.js';
import { useCloudinary } from '../../middlewares/upload.middleware.js';

export const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings(req.user.schoolId);
    res.json(settings || {});
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const updated = await settingsService.updateSettings(req.user.schoolId, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) throw new Error('Aucun fichier téléchargé');
    const logoUrl = useCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
    const updated = await settingsService.updateSettings(req.user.schoolId, { logoUrl });
    res.json({ logoUrl });
  } catch (error) {
    next(error);
  }
};