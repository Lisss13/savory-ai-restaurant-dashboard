import { ru, type Translations } from './ru';
import { en } from './en';
import { useLanguageStore, type Language } from '@/store/language';

const translations: Record<Language, Translations> = {
  ru,
  en,
};

export function useTranslation() {
  const { language, setLanguage } = useLanguageStore();
  const t = translations[language];

  return {
    t,
    language,
    setLanguage,
  };
}

export { type Language } from '@/store/language';
export { type Translations } from './ru';
