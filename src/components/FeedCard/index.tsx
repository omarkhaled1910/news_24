'use client'

import * as React from 'react'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { FeedCardTooltip } from './FeedCardTooltip'
import { FeedCardAccordion } from './FeedCardAccordion'
import type { Locale } from '@/i18n/translations'

interface FeedCardProps {
  article: {
    id: string | number
    title: string
    slug?: string | null
    excerpt?: string | null
    heroImage?: any
    authorName: string
    publishedAt: string
    categories?: any[]
    tags?: Array<{ tag?: string; id?: string }>
    breakingNews?: boolean | null
    content?: any
  }
  locale?: Locale
  onExpand?: (articleId: string) => void
}

export const FeedCard: React.FC<FeedCardProps> = ({
  article,
  locale = 'ar',
  onExpand,
}) => {
  const { id, title, slug, excerpt, heroImage, authorName, publishedAt, categories, tags, breakingNews, content } = article

  const categoryNames = Array.isArray(categories)
    ? categories
        .filter((c: any): c is { title: string } => typeof c === 'object' && c?.title)
        .map((c: { title: string }) => c.title)
    : []

  const articleId = String(id)

  return (
    <article className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Clickable Card Area */}
      <Link
        href={`/articles/${slug}`}
        className="block"
        onClick={(e) => {
          // Prevent navigation if clicking on interactive elements
          if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[data-radix-accordion-trigger]')) {
            e.preventDefault()
          }
        }}
      >
        {/* Hero Image */}
        <div className="relative aspect-16/10 overflow-hidden">
          {heroImage && typeof heroImage === 'object' ? (
            <Media
              resource={heroImage as any}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              imgClassName="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
              <span className="text-muted-foreground text-sm">
                {locale === 'ar' ? 'لا توجد صورة' : 'No image'}
              </span>
            </div>
          )}

          {/* Breaking Badge */}
          {breakingNews && (
            <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">
              {locale === 'ar' ? 'عاجل' : 'Breaking'}
            </div>
          )}

          {/* Category Badge */}
          {categoryNames.length > 0 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
              {categoryNames[0]}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-base font-bold text-foreground hover:text-red-600 transition-colors line-clamp-2 leading-relaxed mb-2">
            {title}
          </h3>

          {/* Meta Row with Tooltip */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{authorName}</span>
            </div>

            {/* Info Tooltip */}
            <FeedCardTooltip
              authorName={authorName}
              publishedAt={publishedAt}
              categories={categories}
              tags={tags}
              locale={locale}
            />
          </div>
        </div>
      </Link>

      {/* Accordion - Expands Below */}
      <FeedCardAccordion
        articleId={articleId}
        excerpt={excerpt}
        content={content}
        slug={slug}
        locale={locale}
      />
    </article>
  )
}
