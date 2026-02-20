import React from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import { ArticleCarousel } from '@/components/ArticleCarousel'
import { LatestArticlesInfinite } from '@/components/LatestArticlesInfinite'
import { BreakingNewsTicker } from '@/components/BreakingNews'
import { Sidebar } from '@/components/Sidebar'
import { CategoryGrid } from '@/components/CategoryGrid'
import { getServerI18n } from '@/i18n/server'

const getHomepageData = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })

    // Fetch featured/hero article
    const featuredResult = await payload.find({
      collection: 'articles',
      where: {
        _status: { equals: 'published' },
        featured: { equals: true },
      },
      limit: 1,
      sort: '-publishedAt',
      depth: 2,
    })

    // Fetch latest articles
    const latestResult = await payload.find({
      collection: 'articles',
      where: {
        _status: { equals: 'published' },
      },
      limit: 12,
      sort: '-publishedAt',
      depth: 2,
    })

    // Fetch breaking news
    const breakingResult = await payload.find({
      collection: 'articles',
      where: {
        _status: { equals: 'published' },
        breakingNews: { equals: true },
      },
      limit: 5,
      sort: '-publishedAt',
    })

    // Fetch categories
    const categoriesResult = await payload.find({
      collection: 'categories',
      limit: 20,
    })

    return {
      featured: featuredResult.docs[0] || null,
      latest: latestResult.docs || [],
      breaking: breakingResult.docs || [],
      categories: categoriesResult.docs || [],
    }
  },
  ['homepage'],
  { tags: ['homepage'], revalidate: 60 },
)

export default async function HomePage() {
  const { locale, t } = await getServerI18n()
  const { featured, latest, breaking, categories } = await getHomepageData()

  // Carousel articles (top 5 latest)
  const carouselArticles = latest.slice(0, 5)
  const gridArticles = latest.slice(5, 13)
  const sidebarArticles = latest.slice(0, 5)

  return (
    <main className="min-h-screen">
      {/* Category Grid - First Component */}
      {categories.length > 0 && <CategoryGrid categories={categories} locale={locale} />}

      {/* Breaking News Ticker */}
      {breaking.length > 0 && <BreakingNewsTicker articles={breaking} />}

      {/* Hero Section */}
      {/* Main Carousel */}
      <section className="container mt-6">
        {carouselArticles.length > 0 && (
          <ArticleCarousel articles={carouselArticles} locale={locale} />
        )}
      </section>

      {/* Sidebar */}
      <section className="container mt-6">
        <Sidebar articles={sidebarArticles} categories={categories} locale={locale} />
      </section>

      {/* Latest Articles Grid - Infinite Scroll */}
      <section className="container mt-10 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground border-r-4 border-red-600 pr-4">
            {t('home.latestNews')}
          </h2>
        </div>

        <LatestArticlesInfinite initialArticles={gridArticles} locale={locale} initialCount={8} />
      </section>
    </main>
  )
}

export const dynamic = 'force-static'
export const revalidate = 60
