import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const fr = require('../locales/fr.json');
const en = require('../locales/en.json');
const ar = require('../locales/ar.json');

const translations = { fr, en, ar };

export const localeMiddleware = (req, res, next) => {
  let lang = req.headers['accept-language'] || 'fr';
  if (lang.includes(',')) lang = lang.split(',')[0];
  if (!['fr', 'en', 'ar'].includes(lang)) lang = 'fr';
  req.lang = lang;
  req.t = (key) => translations[lang][key] || key;
  next();
};