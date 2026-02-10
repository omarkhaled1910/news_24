import React from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import { ArticleCarousel } from '@/components/ArticleCarousel'
import { ArticleCard } from '@/components/ArticleCard'
import { BreakingNewsTicker } from '@/components/BreakingNews'
import { Sidebar } from '@/components/Sidebar'
import Link from 'next/link'
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

      {/* Latest Articles Grid */}
      <section className="container mt-10 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground border-r-4 border-red-600 pr-4">
            {t('home.latestNews')}
          </h2>
          <Link
            href="/articles"
            className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
          >
            {t('home.viewAll')}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {gridArticles.map((article) => (
            <ArticleCard key={article.id} article={article} locale={locale} />
          ))}
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="bg-card border-t border-border py-10">
          <div className="container">
            <h2 className="text-2xl font-bold text-foreground border-r-4 border-red-600 pr-4 mb-6">
              {t('home.categories')}
            </h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/articles?category=${cat.slug}`}
                  className="px-5 py-2.5 bg-background border border-border rounded-full text-sm font-medium text-foreground hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200"
                >
                  {cat.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export const dynamic = 'force-static'
export const revalidate = 60
