interface FetchArticlesParams {
  page: number
  limit?: number
}

export interface ArticleResponse {
  docs: Array<{
    id: string
    title: string
    slug: string
    excerpt: string
    heroImage?: any
    authorName: string
    publishedAt: string
    categories?: any[]
    tags?: Array<{ tag?: string; id?: string }>
    breakingNews?: boolean
    content?: any
  }>
  totalDocs: number
  hasNextPage: boolean
  nextPage: number | null
}

export async function fetchArticles({ page, limit = 10 }: FetchArticlesParams): Promise<ArticleResponse> {
  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort: '-publishedAt',
    depth: '2',
    where: JSON.stringify({ _status: { equals: 'published' } }),
  })

  const response = await fetch(`/api/feed?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch articles: ${response.statusText}`)
  }

  return response.json()
}
