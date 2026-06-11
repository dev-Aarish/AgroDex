import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en';
import id from './locales/id';
import es from './locales/es';
import th from './locales/th';
import nl from './locales/nl';
import hi from './locales/hi';
import zh from './locales/zh';
import fr from './locales/fr';
import ar from './locales/ar';
import ja from './locales/ja';
import ru from './locales/ru';
import ko from './locales/ko';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    resources: {
      
      en: { translation: en },
      id: { translation: id },
      es: { translation: es },
      th: { translation: th },
      nl: { translation: nl },
      hi: { translation: hi },
      zh: { translation: zh },
      fr: { translation: fr },
      ar: { translation: ar },
      ja: { translation: ja },
      ru: { translation: ru },
      ko: { translation: ko },

    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    lng: 'en',
  });

export { i18n };
export default i18n;