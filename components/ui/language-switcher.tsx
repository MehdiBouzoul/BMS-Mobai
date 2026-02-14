'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'fr' : 'en')}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-200 hover:bg-slate-50 transition-all text-slate-600"
      title={locale === 'en' ? 'Passer en Français' : 'Switch to English'}
    >
      <Globe size={14} />
      {locale === 'en' ? 'FR' : 'EN'}
    </button>
  );
}