import React from 'react'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createTranslator, type Locale } from '@/i18n/translations'

interface ArticleCardProps {
  article: {
    id: string | number
    title: string
    slug?: string | null
    excerpt?: string | null
    heroImage?: any
    authorName: string
    publishedAt: string
    categories?: any
    breakingNews?: boolean | null
  }
  variant?: 'default' | 'compact' | 'horizontal'
  locale?: Locale
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  variant = 'default',
  locale = 'ar',
}) => {
  const { title, slug, excerpt, heroImage, authorName, publishedAt, categories, breakingNews } =
    article
  const t = createTranslator(locale)

  const categoryNames = Array.isArray(categories)
    ? categories
        .filter((c: any): c is { title: string; slug?: string | null } => typeof c === 'object')
        .map((c: { title: string }) => c.title)
    : []

  if (variant === 'compact') {
    return (
      <Link href={`/articles/${slug}`} className="group block">
        <article className="flex gap-3 py-3 border-b border-border last:border-0">
          {heroImage && typeof heroImage === 'object' && (
            <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden">
              <Media
                resource={heroImage as any}
                className="w-full h-full object-cover"
                imgClassName="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-red-600 transition-colors line-clamp-2 leading-relaxed">
              {title}
            </h3>
            <time className="text-xs text-muted-foreground mt-1 block">
              {formatDateTime(publishedAt)}
            </time>
          </div>
        </article>
      </Link>
    )
  }

  if (variant === 'horizontal') {
    return (
      <Link href={`/articles/${slug}`} className="group block">
        <article className="flex gap-4 bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
          <div className="shrink-0 w-48 h-32 overflow-hidden">
            {heroImage && typeof heroImage === 'object' ? (
              <Media
                resource={heroImage as any}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                imgClassName="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-xs">{t('article.noImage')}</span>
              </div>
            )}
          </div>
          <div className="flex-1 p-4 flex flex-col justify-center">
            <h3 className="text-base font-bold text-foreground group-hover:text-red-600 transition-colors line-clamp-2 leading-relaxed">
              {title}
            </h3>
            {excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{excerpt}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{authorName}</span>
              <span>{t('common.dotSeparator')}</span>
              <time>{formatDateTime(publishedAt)}</time>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  // Default variant
  return (
    <Link href={`/articles/${slug}`} className="group block h-full">
      <article className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-16/10 overflow-hidden">
          {heroImage && typeof heroImage === 'object' ? (
            <Media
              resource={heroImage as any}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              imgClassName="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-bl from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
              <span className="text-muted-foreground text-sm">{t('article.noImage')}</span>
            </div>
          )}

          {/* Breaking badge */}
          {breakingNews && (
            <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">
              {t('home.breaking')}
            </div>
          )}

          {/* Category badge */}
          {categoryNames && categoryNames.length > 0 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
              {categoryNames[0]}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4">
          <h3 className="text-base font-bold text-foreground group-hover:text-red-600 transition-colors line-clamp-2 leading-relaxed mb-2">
            {title}
          </h3>
          {excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {excerpt}
            </p>
          )}
          <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
            <span className="font-medium">{authorName}</span>
            <span>{t('common.dotSeparator')}</span>
            <time>{formatDateTime(publishedAt)}</time>
          </div>
        </div>
      </article>
    </Link>
  )
}
