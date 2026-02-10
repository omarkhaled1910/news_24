import { NextRequest, NextResponse } from 'next/server'
import { runNewsPipeline } from '@/utilities/cron'

/**
 * API endpoint to manually trigger the news pipeline.
 * Protected by CRON_SECRET or Vercel Cron authentication.
 *
 * Usage:
 *   GET /api/cron?secret=YOUR_CRON_SECRET
 *   or
 *   Authorization: Bearer YOUR_CRON_SECRET
 *
 * Vercel Cron automatically calls this endpoint with x-vercel-cron header.
 */
export async function GET(request: NextRequest) {
  try {
    // Vercel Cron authentication (preferred for Vercel deployments)
    const isVercelCron = request.headers.get('x-vercel-cron') === '1'

    // CRON_SECRET fallback for manual triggers and non-Vercel deployments
    const secret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const querySecret = request.nextUrl.searchParams.get('secret')

    const isAuthorized =
      isVercelCron ||
      (secret && secret !== 'YOUR_CRON_SECRET_HERE' && (authHeader === `Bearer ${secret}` || querySecret === secret))

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[API] Triggering news pipeline...')
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
