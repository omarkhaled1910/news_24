'use client'

import * as React from 'react'
import { useInView } from 'react-intersection-observer'
import { FeedCard } from '@/components/FeedCard'
import { FeedCardSkeleton } from '@/components/FeedCardSkeleton'
import { useArticlesInfinite } from '@/hooks/useArticlesInfinite'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createTranslator, type Locale } from '@/i18n/translations'

interface FeedPageClientProps {
  locale?: Locale
}

export const FeedPageClient: React.FC<FeedPageClientProps> = ({ locale = 'ar' }) => {
  const t = createTranslator(locale)
  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isLoading, isError, error } =
    useArticlesInfinite(10)

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <FeedCardSkeleton key={idx} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {locale === 'ar' ? 'فشل تحميل المقالات' : 'Failed to load articles'}
        </h2>
        <p className="text-muted-foreground mb-6 text-center">
          {error?.message || (locale === 'ar' ? 'حدث خطأ أثناء تحميل المقالات' : 'An error occurred while loading articles')}
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
        </Button>
      </div>
    )
  }

  if (allArticles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {locale === 'ar' ? 'لا توجد مقالات' : 'No articles found'}
        </h2>
        <p className="text-muted-foreground">
          {locale === 'ar' ? 'لم يتم العثور على مقالات للعرض' : 'No articles to display'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Articles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allArticles.map((article: any) => (
          <FeedCard key={article.id} article={article} locale={locale} />
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
