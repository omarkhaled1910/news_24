import React from 'react'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createTranslator, type Locale } from '@/i18n/translations'

interface HeroArticleProps {
  article: {
    id: string | number
    title: string
    slug?: string | null
    excerpt?: string | null
    heroImage?: any
    authorName: string
    publishedAt: string
    channel?: any
    breakingNews?: boolean | null
  }
  locale: Locale
}

export const HeroArticle: React.FC<HeroArticleProps> = ({ article, locale }) => {
  const { title, slug, excerpt, heroImage, authorName, publishedAt, breakingNews } = article
  const t = createTranslator(locale)

  return (
    <Link href={`/articles/${slug}`} className="group block">
      <article className="relative overflow-hidden rounded-xl bg-card border border-border">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden">
          {heroImage && typeof heroImage === 'object' && (
            <Media
              resource={heroImage as any}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              imgClassName="w-full h-full object-cover"
            />
          )}
          {!heroImage && (
            <div className="w-full h-full bg-linear-to-bl from-red-900 to-gray-900 flex items-center justify-center">
              <span className="text-white/30 text-6xl font-bold">{t('common.siteName')}</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

          {/* Breaking badge */}
          {breakingNews && (
            <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-md animate-pulse">
              {t('home.breaking')}
            </div>
          )}

          {/* Content overlay */}
          <div className="absolute bottom-0 right-0 left-0 p-6 lg:p-8">
            <h1 className="text-2xl lg:text-4xl font-bold text-white leading-tight mb-3 group-hover:text-red-400 transition-colors">
              {title}
            </h1>
            {excerpt && (
              <p className="text-white/80 text-sm lg:text-base line-clamp-2 mb-4 max-w-2xl">
                {excerpt}
              </p>
            )}
            <div className="flex items-center gap-4 text-white/60 text-sm">
              <span className="font-medium text-white/80">{authorName}</span>
              <span>{t('common.dotSeparator')}</span>
              <time>{formatDateTime(publishedAt)}</time>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
