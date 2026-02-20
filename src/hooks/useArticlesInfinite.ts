'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchArticles, type ArticleResponse } from '@/lib/api-client'

export function useArticlesInfinite(limit: number = 10) {
  return useInfiniteQuery({
    queryKey: ['feed', 'articles', { limit }],
    queryFn: ({ pageParam = 1 }) => fetchArticles({ page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: ArticleResponse) => {
      if (lastPage.hasNextPage && lastPage.nextPage) {
        return lastPage.nextPage
      }
      return undefined
    },
    refetchOnWindowFocus: false,
  })
}
