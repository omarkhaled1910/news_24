import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React, { cache } from 'react'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import { AuthorCard } from '@/components/AuthorCard'
import { Pagination } from '@/components/Pagination'
import { getServerI18n } from '@/i18n/server'

const queryAuthors = cache(async (page: number = 1) => {
  const payload = await getPayload({ config: configPromise })

  const authors = await payload.find({
    collection: 'authors',
    where: {
      active: {
        equals: true,
      },
    },
    limit: 12,
    page,
    sort: '-subscriberCount',
    depth: 1,
  })

  return authors
})

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}): Promise<Metadata> {
  const { t, locale } = await getServerI18n()
  const params = await searchParams
  const page = Number(params.page) || 1

  return {
    title: page > 1 ? `${t('meta.authorsTitle')} - ${t('common.page')} ${page}` : t('meta.authorsTitle'),
    description: t('meta.authorsDescription'),
    openGraph: {
      title: t('meta.authorsTitle'),
      description: t('meta.authorsDescription'),
      type: 'website',
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SERVER_URL}/authors${page > 1 ? `?page=${page}` : ''}`,
    },
  }
}

export default async function AuthorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { locale, dir, t } = await getServerI18n()
  const params = await searchParams
  const page = Number(params.page) || 1

  const authors = await queryAuthors(page)

  const totalPages = Math.ceil((authors.totalDocs || 0) / 12)

  return (
    <div className="min-h-screen" dir={dir}>
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-orange-600 text-background py-12">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm text-background/80 mb-4">
            <Link href="/" className="hover:text-background transition-colors">
              {t('breadcrumb.home')}
            </Link>
            <span>/</span>
            <span className="text-background font-medium">{t('nav.authors')}</span>
          </nav>
          <h1 className="text-3xl lg:text-5xl font-bold mb-4">{t('nav.authors')}</h1>
          <p className="text-lg text-background/90 max-w-2xl">
            {t('meta.authorsDescription')}
          </p>
        </div>
      </header>

      {/* Authors Grid */}
      <div className="container py-8">
        {authors.docs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {authors.docs.map((author) => (
                <AuthorCard
                  key={author.id}
                  author={author as any}
                  variant="default"
                  locale={locale}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl="/authors"
                locale={locale}
              />
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {locale === 'ar' ? 'لا يوجد كتاب حالياً' : 'No authors found'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
