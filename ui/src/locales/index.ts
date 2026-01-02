import en from './en.json';
import zh from './zh.json';

export const locales = {
  en,
  zh,
} as const;

export type Locale = keyof typeof locales;
export type TranslationKeys = typeof en;

export const defaultLocale: Locale = 'en';
export const supportedLocales: Locale[] = ['en', 'zh'];
