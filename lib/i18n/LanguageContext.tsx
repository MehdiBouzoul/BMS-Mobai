'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Locale } from './translations';
import translations from './translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (section: string, key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (_section, key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('wms-locale');
    if (saved === 'en' || saved === 'fr') {
      setLocaleState(saved);
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('wms-locale', newLocale);
  };

  const t = (section: string, key: string): string => {
    const sectionData = translations[section];
    if (!sectionData || !sectionData[key]) {
      return key;
    }
    return sectionData[key][locale] || sectionData[key]['en'] || key;
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
