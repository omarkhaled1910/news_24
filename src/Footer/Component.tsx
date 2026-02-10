import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { getServerI18n } from '@/i18n/server'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()
  const { t } = await getServerI18n()

  const navItems = footerData?.navItems || []

  return (
    <footer className="mt-auto bg-gray-900 text-gray-300">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link className="flex items-center mb-4" href="/">
              <Logo className="[&_span]:text-white" />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4">{t('nav.quickLinks')}</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                {t('nav.home')}
              </Link>
              <Link href="/articles" className="text-sm text-gray-400 hover:text-white transition-colors">
                {t('nav.latestNews')}
              </Link>
              {navItems.map(({ link }, i) => {
                return <CMSLink className="text-sm text-gray-400 hover:text-white transition-colors" key={i} {...link} />
              })}
            </nav>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-white font-bold mb-4">{t('nav.aboutSite')}</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t('footer.aboutDescription')}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            {t('footer.rightsReserved', { year: new Date().getFullYear() })}
          </p>
          <p className="text-xs text-gray-500">
            {t('footer.poweredBy')}
          </p>
        </div>
      </div>
    </footer>
  )
}
