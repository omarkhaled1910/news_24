'use client'

import * as React from 'react'
import { useInView } from 'react-intersection-observer'
import { ArticleCard } from '@/components/ArticleCard'
import { useArticlesInfinite } from '@/hooks/useArticlesInfinite'
import { useQueryClient } from '@tanstack/react-query'
import type { ArticleResponse } from '@/lib/api-client'
import type { Locale } from '@/i18n/translations'

interface LatestArticlesInfiniteProps {
  initialArticles: any[]
  locale?: Locale
  initialCount?: number
}

export const LatestArticlesInfinite: React.FC<LatestArticlesInfiniteProps> = ({
  initialArticles,
  locale = 'ar',
  initialCount = 8,
}) => {
  const queryClient = useQueryClient()

  // Hydrate the infinite query with initial data
  React.useEffect(() => {
    const initialData: ArticleResponse = {
      docs: initialArticles,
      totalDocs: initialArticles.length + 100, // Assume more articles exist
      hasNextPage: true,
      nextPage: 2,
    }

    queryClient.setQueryData(
      ['feed', 'articles', { limit: initialCount }],
      {
        pages: [initialData],
        pageParams: [1],
      }
    )
  }, [initialArticles, initialCount, queryClient])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useArticlesInfinite(initialCount)

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  // Auto-fetch next page when in view
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Flatten all pages into a single array
  const allArticles = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.docs) || []
  }, [data])

  return (
    <div>
      {/* Articles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allArticles.map((article) => (
          <ArticleCard key={article.id} article={article} locale={locale} />
        ))}
      </div>

      {/* Loading Indicator for Next Page */}
      <div ref={loadMoreRef} className="mt-8 flex justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">
              {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </span>
          </div>
        )}
      </div>

      {/* End of Articles Message */}
      {!hasNextPage && allArticles.length > 0 && (
        <div className="mt-8 text-center text-muted-foreground text-sm">
          {locale === 'ar' ? 'تم عرض جميع المقالات' : "You've reached the end"}
        </div>
      )}
    </div>
  )
}
