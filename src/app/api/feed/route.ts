import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 10

    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'articles',
      where: {
        _status: { equals: 'published' },
      },
      limit,
      page,
      sort: '-publishedAt',
      depth: 2,
    })

    return NextResponse.json({
      docs: result.docs,
      totalDocs: result.totalDocs,
      hasNextPage: result.hasNextPage,
      nextPage: result.nextPage,
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}
