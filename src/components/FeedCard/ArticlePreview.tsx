'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import RichText from '@/components/RichText'
import type { Locale } from '@/i18n/translations'

interface ArticlePreviewProps {
  excerpt?: string | null
  content?: any
  slug?: string | null
  locale?: Locale
}

export const ArticlePreview: React.FC<ArticlePreviewProps> = ({
  excerpt,
  content,
  slug,
  locale = 'ar',
}) => {
  const readMoreText = locale === 'ar' ? 'اقرأ المزيد' : 'Read More'

  return (
    <div className="space-y-4">
      {/* Excerpt */}
      {excerpt && (
        <p className="text-sm text-muted-foreground leading-relaxed">{excerpt}</p>
      )}

      {/* Rich Text Content (truncated preview) */}
      {content && (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <RichText data={content} />
        </div>
      )}

      {/* Read More Link */}
      {slug && (
        <Link
          href={`/articles/${slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
        >
          {readMoreText}
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}
