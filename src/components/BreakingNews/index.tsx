'use client'
import React from 'react'
import Link from 'next/link'
import { useI18n } from '@/i18n/client'

interface BreakingNewsProps {
  articles: Array<{
    id: string
    title: string
    slug?: string | null
  }>
}

export const BreakingNewsTicker: React.FC<BreakingNewsProps> = ({ articles }) => {
  const { t } = useI18n()
  if (!articles || articles.length === 0) return null

  return (
    <div className="bg-red-600 text-white overflow-hidden">
      <div className="container flex items-center gap-0">
        {/* Label */}
        <div className="shrink-0 bg-red-700 px-4 py-2.5 font-bold text-sm flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse" />
          {t('home.breaking')}
        </div>

        {/* Ticker */}
        <div className="overflow-hidden flex-1 relative">
          <div className="animate-marquee whitespace-nowrap py-2.5 flex gap-8">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="text-sm hover:underline inline-block"
              >
                {article.title}
              </Link>
            ))}
            {/* Duplicate for seamless loop */}
            {articles.map((article) => (
              <Link
                key={`dup-${article.id}`}
                href={`/articles/${article.slug}`}
                className="text-sm hover:underline inline-block"
              >
                {article.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
