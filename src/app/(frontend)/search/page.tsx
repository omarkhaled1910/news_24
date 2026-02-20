import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { Search } from '@/search/Component'
import PageClient from './page.client'
import { getServerI18n } from '@/i18n/server'
import Link from 'next/link'
import { SearchLayout } from './Search-layout'

type Args = {
  searchParams: Promise<{
    q?: string
    category?: string
    sort?: string
  }>
}

export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { locale, dir, t } = await getServerI18n()
  const searchParams = await searchParamsPromise
  const query = searchParams.q || ''
  const categorySlug = searchParams.category
  const sort = searchParams.sort || 'relevance'

  const payload = await getPayload({ config: configPromise })

  // Fetch categories for filters
  const categoriesResult = await payload.find({
    collection: 'categories',
    limit: 20,
  })

  const categoryName = categorySlug
    ? categoriesResult.docs.find((c) => c.slug === categorySlug)
    : null

  const localizedCategoryName = categoryName
    ? locale === 'ar'
      ? (categoryName as any).categoryAr
      : (categoryName as any).categoryEn
    : null

  return (
    <div className="min-h-screen pb-16" dir={dir}>
      <PageClient />

      {/* Header */}
      <div className="bg-gradient-to-br from-muted/50 to-background border-b border-border">
        <div className="container pt-12 pb-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-red-600 transition-colors">
              {t('breadcrumb.home')}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">
              {t('search.title')}
            </span>
          </nav>

          {/* Search Input */}
          <div className="max-w-2xl mx-auto">
            <Search locale={locale} defaultValue={query} />
          </div>

          {/* Active filters display */}
          {(query || categorySlug) && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {query && (
                <Link
                  href={categorySlug ? `/search?category=${categorySlug}` : '/search'}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded-full hover:bg-red-700 transition-colors"
                >
                  {t('search.title')}: &quot;{query}&quot;
                  <span className="ml-1">×</span>
                </Link>
              )}
              {localizedCategoryName && (
                <Link
                  href={query ? `/search?q=${query}` : '/search'}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-foreground text-sm rounded-full hover:bg-muted/80 transition-colors"
                >
                  {localizedCategoryName}
                  <span className="ml-1">×</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results and Filters */}
      <SearchLayout
        query={query}
        category={categorySlug}
        sort={sort}
        locale={locale}
        categories={categoriesResult.docs}
      />
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Search | News 24',
    description: 'Search articles on News 24',
  }
}
