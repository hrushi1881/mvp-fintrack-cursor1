import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend) // loads translations from your server
  .use(LanguageDetector) // detects user language
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    fallbackLng: 'en', // fallback language if translation is not found
    debug: true, // enable debug mode for development
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // path to your translation files
    },
    ns: ['translation'], // default namespace
    defaultNS: 'translation',
    react: {
      useSuspense: true, // enable suspense for translations
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;