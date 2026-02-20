import React from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { ArticleCard } from '@/components/ArticleCard'
import { CategoryFilter } from '@/components/CategoryFilter'
import { Pagination } from '@/components/Pagination'
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
  const { locale, dir, t } = await getServerI18n()
  const searchParams = await searchParamsPromise
  const currentPage = Number(searchParams.page) || 1
  const categorySlug = searchParams.category

  const payload = await getPayload({ config: configPromise })

  // Fetch the current category if provided
  let currentCategory = null
  const where: Record<string, any> = {
    _status: { equals: 'published' },
  }

  if (categorySlug) {
    // Find category by slug
    const catResult = await payload.find({
      collection: 'categories',
      where: { slug: { equals: categorySlug } },
      limit: 1,
      depth: 1,
    })
    if (catResult.docs.length > 0) {
      currentCategory = catResult.docs[0]
      where['categories'] = { in: [currentCategory.id] }
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

  // Fetch all categories for the filter
  const categoriesResult = await payload.find({
    collection: 'categories',
    limit: 20,
  })

  const { docs: articles, totalPages, hasPrevPage, hasNextPage } = result

  // Get localized category name
  const categoryName = currentCategory
    ? (locale === 'ar'
        ? (currentCategory as any).categoryAr
        : (currentCategory as any).categoryEn)
    : null

  return (
    <main className="min-h-screen pb-16" dir={dir}>
      <div className="container mt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-foreground">
              {categoryName || t('articles.all')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('articles.count', { count: result.totalDocs })}
            </p>
          </div>
          <Link href="/" className="text-red-600 hover:text-red-700 text-sm font-medium shrink-0">
            {t('article.backToHomeWithArrow')}
          </Link>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content - articles grid */}
          <div className="flex-1 min-w-0">
            {articles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl="/articles"
                searchParams={categorySlug ? { category: categorySlug } : undefined}
                locale={locale}
              />
            )}
          </div>

          {/* Sidebar - Category Filter */}
          <aside className="w-full lg:w-72 shrink-0">
            <CategoryFilter
              categories={categoriesResult.docs}
              currentCategory={categorySlug}
              locale={locale}
            />
          </aside>
        </div>
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
