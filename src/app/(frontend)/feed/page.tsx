import React from 'react'
import { FeedPageClient } from './page.client'
import { getServerI18n } from '@/i18n/server'
import type { Metadata } from 'next'

export default async function FeedPage() {
  const { locale, dir } = await getServerI18n()

  return (
    <main className="min-h-screen pb-16" dir={dir}>
      <div className="container mt-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {locale === 'ar' ? 'المتابعة' : 'Feed'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'ar'
              ? 'تصفح أحدث المقالات والمحتوى'
              : 'Browse the latest articles and content'}
          </p>
        </div>

        {/* Feed Content */}
        <FeedPageClient locale={locale} />
      </div>
    </main>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerI18n()

  return {
    title: locale === 'ar' ? 'المتابعة' : 'Feed',
    description:
      locale === 'ar'
        ? 'تصفح أحدث المقالات والمحتوى'
        : 'Browse the latest articles and content',
  }
}
