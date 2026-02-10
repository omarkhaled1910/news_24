import React from 'react'
import { ArticleCard } from '@/components/ArticleCard'
import Link from 'next/link'
import { createTranslator, type Locale } from '@/i18n/translations'

interface SidebarProps {
  articles: Array<{
    id: string
    title: string
    slug?: string | null
    excerpt?: string | null
    heroImage?: unknown
    authorName: string
    publishedAt: string
  }>
  categories?: Array<{
    id: string
    title: string
    slug?: string | null
  }>
  locale: Locale
}

export const Sidebar: React.FC<SidebarProps> = ({ articles, categories, locale }) => {
  const t = createTranslator(locale)

  return (
    <aside className="space-y-6">
      {/* Most Read */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-red-600 px-4 py-3">
          <h3 className="text-white font-bold text-sm">{t('home.mostRead')}</h3>
        </div>
        <div className="p-4">
          {articles.map((article, index) => (
            <div key={article.id} className="flex gap-3 items-start">
              <span className="shrink-0 w-8 h-8 rounded-full bg-red-600/10 text-red-600 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <div className="flex-1">
                <ArticleCard article={article as any} variant="compact" locale={locale} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Categories */}
      {categories && categories.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="bg-foreground px-4 py-3">
            <h3 className="text-background font-bold text-sm">{t('nav.sections')}</h3>
          </div>
          <div className="p-3 flex flex-wrap gap-2">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                href={`/articles?category=${cat.slug}`}
                className="px-3 py-1.5 bg-muted text-foreground text-xs rounded-full hover:bg-red-600 hover:text-white transition-colors"
              >
                {cat.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
