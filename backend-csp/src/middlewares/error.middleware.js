import logger from '../config/logger.js';
export const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);
  const status = err.status || (err.name === 'ZodError' ? 400 : 500);
  const isProd = process.env.NODE_ENV === 'production';
  const message = (status === 500 && isProd)
    ? 'Erreur interne du serveur'
    : (err.message || 'Erreur serveur');
  res.status(status).json({ success: false, message });
};