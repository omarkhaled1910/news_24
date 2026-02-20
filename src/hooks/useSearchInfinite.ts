'use client'

import { useInfiniteQuery } from '@tanstack/react-query'

interface SearchParams {
  query: string
  category?: string
  sort?: string
  limit?: number
}

interface SearchResponse {
  docs: Array<{
    id: string | number
    title: string
    slug: string
    categories?: any[]
    meta?: any
    publishedAt: string
  }>
  totalDocs: number
  hasNextPage: boolean
  nextPage: number | null
}

async function fetchSearchResults(
  params: SearchParams & { page: number }
): Promise<SearchResponse> {
  const { query, category, sort, page, limit = 12 } = params

  const searchParams = new URLSearchParams()
  if (query) searchParams.set('q', query)
  if (category) searchParams.set('category', category)
  if (sort) searchParams.set('sort', sort)
  searchParams.set('page', String(page))
  searchParams.set('limit', String(limit))

  const response = await fetch(`/api/search?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch search results')
  }

  return response.json()
}

export function useSearchInfinite(params: SearchParams) {
  const { query, category, sort, limit = 12 } = params

  return useInfiniteQuery({
    queryKey: ['search', { query, category, sort, limit }],
    queryFn: ({ pageParam = 1 }) =>
      fetchSearchResults({ query, category, sort, page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: SearchResponse) => {
      // Use the API's hasNextPage to determine if there are more results
      if (lastPage.hasNextPage && lastPage.nextPage) {
        return lastPage.nextPage
      }
      return undefined
    },
    refetchOnWindowFocus: false,
  })
}
