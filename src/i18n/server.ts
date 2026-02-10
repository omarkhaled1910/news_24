import { cookies } from 'next/headers'

import { createTranslator, getDirection, isLocale, type Locale } from './translations'

export const getServerLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies()
  const localeFromCookie = cookieStore.get('locale')?.value

  if (isLocale(localeFromCookie)) return localeFromCookie
  return 'ar'
}

export const getServerI18n = async () => {
  const locale = await getServerLocale()
  const dir = getDirection(locale)
  const t = createTranslator(locale)

  return { locale, dir, t }
}
