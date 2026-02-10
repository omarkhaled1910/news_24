'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useI18n } from '@/i18n/client'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const { locale, t } = useI18n()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <header
      className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border"
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="container">
        <div className="py-4 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-foreground hover:text-red-600 transition-colors">
              {t('nav.home')}
            </Link>
            <Link href="/articles" className="text-foreground hover:text-red-600 transition-colors">
              {t('nav.latestNews')}
            </Link>
            <HeaderNav data={data} />
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeSelector />
          </div>
        </div>
      </div>

      {/* Date bar */}
      <div className="bg-muted border-t border-border">
        <div className="container py-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span>
            {t('header.lastUpdated')}:{' '}
            {new Date().toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </header>
  )
}
