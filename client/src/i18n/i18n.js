import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import gu from '../locales/gu.json';

const savedLang = localStorage.getItem('gujarat_portal_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      gu: { translation: gu }
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

document.documentElement.lang = savedLang;

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('gujarat_portal_lang', lng);
  document.documentElement.lang = lng;
});

export default i18n;
