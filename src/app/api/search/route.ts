import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const categorySlug = searchParams.get('category')
    const sort = searchParams.get('sort') || 'relevance'
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 12

    const payload = await getPayload({ config: configPromise })

    // For category filter, we need to get the category ID first
    let categoryId: string | null = null
    if (categorySlug) {
      const catResult = await payload.find({
        collection: 'categories',
        where: { slug: { equals: categorySlug } },
        limit: 1,
        depth: 0,
      })
      if (catResult.docs.length > 0) {
        categoryId = String(catResult.docs[0].id)
      }
    }

    // Determine sort order
    let sortOption: string | undefined = undefined
    if (sort === 'newest') {
      sortOption = '-publishedAt'
    } else if (sort === 'oldest') {
      sortOption = 'publishedAt'
    }

    let posts
    let totalDocs = 0
    let hasNextPage = false
    let nextPage = null

    if (query || categoryId) {
      // We have a search query or category filter - fetch and filter
      const allPosts = await payload.find({
        collection: 'search',
        depth: 1,
        pagination: false,
        limit: 2000, // Fetch all for client-side filtering
        ...(sortOption ? { sort: sortOption } : {}),
      })

      // Filter by search query (case-insensitive)
      let filteredDocs = allPosts.docs

      if (query) {
        const lowerQuery = query.toLowerCase()
        filteredDocs = filteredDocs.filter((doc: any) => {
          // Search in title
          if (doc.title && doc.title.toLowerCase().includes(lowerQuery)) {
            return true
          }
          // Search in meta.title
          if (doc.meta?.title && doc.meta.title.toLowerCase().includes(lowerQuery)) {
            return true
          }
          // Search in meta.description
          if (doc.meta?.description && doc.meta.description.toLowerCase().includes(lowerQuery)) {
            return true
          }
          // Search in slug
          if (doc.slug && doc.slug.toLowerCase().includes(lowerQuery)) {
            return true
          }
          return false
        })
      }

      // Filter by category
      if (categoryId) {
        filteredDocs = filteredDocs.filter((doc: any) => {
          if (!doc.categories || !Array.isArray(doc.categories)) return false
          return doc.categories.some((cat: any) => cat.categoryID === categoryId)
        })
      }

      totalDocs = filteredDocs.length
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedDocs = filteredDocs.slice(startIndex, endIndex)

      hasNextPage = endIndex < filteredDocs.length
      nextPage = hasNextPage ? page + 1 : null

      posts = { docs: paginatedDocs }
    } else {
      // No query or category - use Payload's native pagination for all results
      posts = await payload.find({
        collection: 'search',
        depth: 1,
        limit,
        page,
        ...(sortOption ? { sort: sortOption } : {}),
      })

      totalDocs = posts.totalDocs
      hasNextPage = posts.hasNextPage
      nextPage = posts.nextPage
    }

    return NextResponse.json({
      docs: posts.docs,
      totalDocs,
      hasNextPage,
      nextPage,
    })
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    )
  }
}


