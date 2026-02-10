import React from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { ArticleCard } from '@/components/ArticleCard'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getServerI18n } from '@/i18n/server'

type Args = {
  searchParams: Promise<{
    page?: string
    category?: string
  }>
}

export default async function ArticlesPage({ searchParams: searchParamsPromise }: Args) {
  const { locale, t } = await getServerI18n()
  const searchParams = await searchParamsPromise
  const currentPage = Number(searchParams.page) || 1
  const category = searchParams.category

  const payload = await getPayload({ config: configPromise })

  const where: Record<string, any> = {
    _status: { equals: 'published' },
  }

  if (category) {
    // Find category by slug
    const catResult = await payload.find({
      collection: 'categories',
      where: { slug: { equals: category } },
      limit: 1,
    })
    if (catResult.docs.length > 0) {
      where['categories'] = { in: [catResult.docs[0].id] }
    }
  }

  const result = await payload.find({
    collection: 'articles',
    where: where as any,
    limit: 12,
    page: currentPage,
    sort: '-publishedAt',
    depth: 2,
  })

  const { docs: articles, totalPages, hasPrevPage, hasNextPage } = result

  return (
    <main className="min-h-screen pb-16">
      <div className="container mt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {category ? t('articles.byCategory', { category }) : t('articles.all')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('articles.count', { count: result.totalDocs })}
            </p>
          </div>
          <Link href="/" className="text-red-600 hover:text-red-700 text-sm font-medium">
            {t('article.backToHomeWithArrow')}
          </Link>
        </div>

        {/* Articles grid */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article as any} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">{t('articles.empty')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('articles.emptyHint')}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex justify-center gap-2 mt-10">
            {hasPrevPage && (
              <Link
                href={`/articles?page=${currentPage - 1}${category ? `&category=${category}` : ''}`}
                className="px-4 py-2 bg-card border border-border rounded-lg text-sm hover:bg-muted transition-colors"
              >
                {t('pagination.previous')}
              </Link>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={`/articles?page=${page}${category ? `&category=${category}` : ''}`}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  page === currentPage
                    ? 'bg-red-600 text-white'
                    : 'bg-card border border-border hover:bg-muted'
                }`}
              >
                {page}
              </Link>
            ))}

            {hasNextPage && (
              <Link
                href={`/articles?page=${currentPage + 1}${category ? `&category=${category}` : ''}`}
                className="px-4 py-2 bg-card border border-border rounded-lg text-sm hover:bg-muted transition-colors"
              >
                {t('pagination.next')}
              </Link>
            )}
          </nav>
        )}
      </div>
    </main>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n()

  return {
    title: t('meta.articlesTitle'),
    description: t('meta.articlesDescription'),
  }
}
