'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { useRouter } from 'next/navigation'

import { createTranslator, getDirection, type Locale, type TranslationParams } from './translations'

type I18nContextType = {
  locale: Locale
  dir: 'rtl' | 'ltr'
  t: (key: string, params?: TranslationParams) => string
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextType | null>(null)

export const I18nProvider = ({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) => {
  const router = useRouter()

  const value = useMemo<I18nContextType>(() => {
    const t = createTranslator(initialLocale)
    const dir = getDirection(initialLocale)

    return {
      locale: initialLocale,
      dir,
      t,
      setLocale: (locale: Locale) => {
        const oneYear = 60 * 60 * 24 * 365
        document.cookie = `locale=${locale}; path=/; max-age=${oneYear}; samesite=lax`
        router.refresh()
      },
    }
  }, [initialLocale]) // eslint-disable-line react-hooks/exhaustive-deps -- router is intentionally omitted

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider')
  }
  return context
}
