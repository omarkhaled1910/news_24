import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React, { cache } from 'react'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import { AuthorCard } from '@/components/AuthorCard'
import { getServerI18n } from '@/i18n/server'

const queryAuthors = cache(async (page: number = 1) => {
  const payload = await getPayload({ config: configPromise })

  const authors = await payload.find({
    collection: 'authors',
    where: {
      and: [
        {
          active: {
            equals: true,
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
      ],
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
              <div className="flex justify-center items-center gap-2 mt-12">
                {page > 1 && (
                  <Link
                    href={`/authors?page=${page - 1}`}
                    className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    {locale === 'ar' ? 'السابق' : 'Previous'}
                  </Link>
                )}

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        (p >= page - 1 && p <= page + 1),
                    )
                    .map((p, i, arr) => {
                      const prev = arr[i - 1]
                      if (prev && p - prev > 1) {
                        return (
                          <React.Fragment key={`ellipsis-${p}`}>
                            <span className="px-2 py-2 text-muted-foreground">...</span>
                            <Link
                              href={`/authors?page=${p}`}
                              className={`px-4 py-2 rounded-lg transition-colors ${
                                p === page
                                  ? 'bg-red-600 text-background font-semibold'
                                  : 'bg-card border border-border hover:bg-muted'
                              }`}
                            >
                              {p}
                            </Link>
                          </React.Fragment>
                        )
                      }
                      return (
                        <Link
                          key={p}
                          href={`/authors?page=${p}`}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            p === page
                              ? 'bg-red-600 text-background font-semibold'
                              : 'bg-card border border-border hover:bg-muted'
                          }`}
                        >
                          {p}
                        </Link>
                      )
                    })}
                </div>

                {page < totalPages && (
                  <Link
                    href={`/authors?page=${page + 1}`}
                    className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    {locale === 'ar' ? 'التالي' : 'Next'}
                  </Link>
                )}
              </div>
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
