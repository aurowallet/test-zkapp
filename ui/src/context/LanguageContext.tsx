"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useRouter } from 'next/router';
import { locales, Locale, defaultLocale, TranslationKeys } from '@/locales';

interface LanguageContextType {
  locale: Locale;
  t: TranslationKeys;
  switchLanguage: (newLocale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  
  const locale = useMemo<Locale>(() => {
    const pathLocale = router.asPath.startsWith('/zh') ? 'zh' : 'en';
    return pathLocale;
  }, [router.asPath]);

  const t = useMemo(() => {
    return locales[locale] || locales[defaultLocale];
  }, [locale]);

  const switchLanguage = (newLocale: Locale) => {
    const currentPath = router.asPath;
    let newPath: string;
    
    if (newLocale === 'zh') {
      if (currentPath.startsWith('/zh')) {
        return;
      }
      newPath = '/zh' + (currentPath === '/' ? '' : currentPath);
    } else {
      if (currentPath.startsWith('/zh')) {
        newPath = currentPath.replace('/zh', '') || '/';
      } else {
        return;
      }
    }
    
    router.push(newPath);
  };

  const value = useMemo(() => ({
    locale,
    t,
    switchLanguage,
  }), [locale, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = () => {
  const { t, locale } = useLanguage();
  return { t, locale };
};
