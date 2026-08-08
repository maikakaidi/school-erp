import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

const savedLang = localStorage.getItem('app-language') || 'fr';

const RTL_LANGS = ['ar'];

function applyDir(lng) {
  const dir = RTL_LANGS.includes(lng) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
  document.body.style.fontFamily = lng === 'ar'
    ? "'Noto Sans Arabic', 'DM Sans', sans-serif"
    : "'DM Sans', sans-serif";
}

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: savedLang,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

applyDir(savedLang);

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('app-language', lng);
  applyDir(lng);
});

export default i18n;
