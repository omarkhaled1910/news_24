'use client'

import * as React from 'react'
import { useInView } from 'react-intersection-observer'
import { SearchCard } from '@/components/SearchCard'
import { useSearchInfinite } from '@/hooks/useSearchInfinite'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/translations'

interface SearchResultsProps {
  query: string
  category?: string
  sort?: string
  locale?: Locale
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  category,
  sort,
  locale = 'ar',
}) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } =
    useSearchInfinite({ query, category, sort, limit: 12 })

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
  const allResults = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.docs) || []
  }, [data])

  const totalCount = data?.pages[0]?.totalDocs || 0

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="border border-border rounded-xl overflow-hidden bg-card animate-pulse"
          >
            <div className="aspect-video w-full bg-muted" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {locale === 'ar' ? 'فشل البحث' : 'Search failed'}
        </h2>
        <p className="text-muted-foreground mb-6 text-center">
          {error?.message || (locale === 'ar' ? 'حدث خطأ أثناء البحث' : 'An error occurred while searching')}
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
        </Button>
      </div>
    )
  }

  // Empty state - only show if we've loaded and have no results
  if (allResults.length === 0 && !isLoading) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-muted rounded-full mb-4">
          <svg
            className="w-10 h-10 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {locale === 'en' ? 'No results found' : 'لم يتم العثور على نتائج'}
        </h3>
        <p className="text-muted-foreground">
          {locale === 'en'
            ? 'Try adjusting your search or filters'
            : 'حاول تغيير كلمة البحث أو الفلاتر'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Results count */}
      <div className="mb-6 text-sm text-muted-foreground">
        {locale === 'en'
          ? `${totalCount} result${totalCount !== 1 ? 's' : ''} found`
          : `${totalCount} نتيجة`}
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {allResults.map((doc: any) => (
          <SearchCard key={doc.id} doc={doc} locale={locale} />
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

      {/* End of Results Message */}
      {!hasNextPage && allResults.length > 0 && (
        <div className="mt-8 text-center text-muted-foreground text-sm">
          {locale === 'ar' ? 'تم عرض جميع النتائج' : "You've seen all results"}
        </div>
      )}
    </div>
  )
}
