import { NextRequest, NextResponse } from 'next/server'
import { runNewsPipeline } from '@/utilities/cron'

/**
 * API endpoint to manually trigger the news pipeline.
 * Protected by CRON_SECRET.
 * 
 * Usage:
 *   GET /api/cron?secret=YOUR_CRON_SECRET
 *   or
 *   Authorization: Bearer YOUR_CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET
    if (!secret || secret === 'YOUR_CRON_SECRET_HERE') {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 },
      )
    }

    // Check authorization
    const authHeader = request.headers.get('authorization')
    const querySecret = request.nextUrl.searchParams.get('secret')

    const isAuthorized =
      authHeader === `Bearer ${secret}` || querySecret === secret

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[API] Manually triggering news pipeline...')
    const result = await runNewsPipeline()

    return NextResponse.json({
      success: true,
      message: 'News pipeline completed',
      ...result,
    })
  } catch (error) {
    console.error('[API] Cron endpoint error:', error)
    return NextResponse.json(
      { error: 'Pipeline failed', details: (error as Error).message },
      { status: 500 },
    )
  }
}
