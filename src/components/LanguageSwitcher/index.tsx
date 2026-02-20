'use client'

import React from 'react'

import { useI18n } from '@/i18n/client'
import type { Locale } from '@/i18n/translations'

export const LanguageSwitcher = () => {
  const { locale, setLocale, t } = useI18n()

  const handleChange = (nextLocale: Locale) => {
    if (nextLocale !== locale) {
      setLocale(nextLocale)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* <span className="text-xs text-muted-foreground hidden sm:inline">{t('language.switchLabel')}</span> */}
      <div className="inline-flex items-center rounded-md border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => handleChange('ar')}
          className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
            locale === 'ar'
              ? 'bg-red-600 text-white'
              : 'bg-background text-foreground hover:bg-muted'
          }`}
        >
          {t('language.arabic')}
        </button>
        <button
          type="button"
          onClick={() => handleChange('en')}
          className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
            locale === 'en'
              ? 'bg-red-600 text-white'
              : 'bg-background text-foreground hover:bg-muted'
          }`}
        >
          {t('language.english')}
        </button>
      </div>
    </div>
  )
}
