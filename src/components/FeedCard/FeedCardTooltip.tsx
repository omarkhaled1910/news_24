'use client'

import * as React from 'react'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDateTime } from '@/utilities/formatDateTime'
import type { Locale } from '@/i18n/translations'

interface FeedCardTooltipProps {
  authorName: string
  publishedAt: string
  categories?: any[]
  tags?: Array<{ tag?: string; id?: string }>
  locale?: Locale
}

export const FeedCardTooltip: React.FC<FeedCardTooltipProps> = ({
  authorName,
  publishedAt,
  categories,
  tags,
  locale = 'ar',
}) => {
  const categoryNames = Array.isArray(categories)
    ? categories
        .filter((c: any): c is { title: string } => typeof c === 'object' && c?.title)
        .map((c: { title: string }) => c.title)
    : []

  const tagList = Array.isArray(tags)
    ? tags
        .filter((t): t is { tag: string } => typeof t === 'object' && !!t?.tag)
        .map((t: { tag: string }) => t.tag)
    : []

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-muted-foreground/10 transition-colors"
            aria-label="Article info"
          >
            <Info className="w-4 h-4 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-xs">
          <div className="space-y-2">
            {/* Author */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {locale === 'ar' ? 'الكاتب:' : 'Author:'}
              </span>
              <span className="text-xs">{authorName}</span>
            </div>

            {/* Published Date */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {locale === 'ar' ? 'تاريخ النشر:' : 'Published:'}
              </span>
              <span className="text-xs">{formatDateTime(publishedAt)}</span>
            </div>

            {/* Categories */}
            {categoryNames.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  {locale === 'ar' ? 'التصنيفات:' : 'Categories:'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {categoryNames.map((cat, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tagList.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  {locale === 'ar' ? 'الوسوم:' : 'Tags:'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {tagList.slice(0, 5).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted-foreground/10 text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
