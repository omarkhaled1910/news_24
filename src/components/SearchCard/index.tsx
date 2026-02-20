'use client'

import * as React from 'react'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Locale } from '@/i18n/translations'

interface SearchCardProps {
  doc: {
    id: string | number
    title?: string
    slug?: string
    meta?: {
      description?: string
      title?: string
      image?: any
    }
  }
  locale?: Locale
}

// Truncate text to a specific length
function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export const SearchCard: React.FC<SearchCardProps> = ({ doc, locale = 'ar' }) => {
  const { slug, meta, title } = doc
  const { description, image: metaImage } = meta || {}
  const sanitizedDescription = description?.replace(/\s/g, ' ') || ''

  // Truncate description to 80 characters
  const truncatedDesc = truncateText(sanitizedDescription, 80)
  const hasDescription = sanitizedDescription.length > 0

  return (
    <article className="flex flex-col h-full border border-border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300">
      {/* Bigger Image */}
      <Link href={`/posts/${slug}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden">
          {!metaImage ? (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">
                {locale === 'ar' ? 'لا توجد صورة' : 'No image'}
              </span>
            </div>
          ) : (
            <Media
              resource={metaImage}
              className="w-full h-full object-cover"
              imgClassName="w-full h-full object-cover"
            />
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4">
        {title && (
          <h3 className="text-base font-semibold text-foreground hover:text-red-600 transition-colors line-clamp-2 leading-relaxed mb-2">
            <Link href={`/posts/${slug}`}>{title}</Link>
          </h3>
        )}

        {/* Description with Tooltip */}
        {hasDescription && (
          <div className="mt-auto">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-muted-foreground line-clamp-2 hover:text-foreground transition-colors cursor-help">
                    {truncatedDesc}
                  </p>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  className="max-w-xs max-h-64 overflow-y-auto text-sm"
                >
                  <div className="space-y-2">
                    {/* Show full description */}
                    <p className="whitespace-pre-wrap">{sanitizedDescription}</p>
                    {/* Link to article */}
                    <Link
                      href={`/posts/${slug}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 mt-2"
                    >
                      {locale === 'ar' ? 'اقرأ المزيد' : 'Read more'}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </article>
  )
}
