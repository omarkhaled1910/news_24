/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts.
 * Used to initialize the automated news cron job.
 *
 * Note: On Vercel, cron jobs are handled by Vercel Cron via vercel.json
 * which calls /api/cron endpoint, so we don't start node-cron there.
 */
export async function register() {
  // Only run on the Node.js server runtime (not Edge)
  // Skip Vercel since it uses Vercel Cron Jobs instead
  if (process.env.NEXT_RUNTIME === 'nodejs' && !process.env.VERCEL) {
    const { startCronJobs } = await import('./utilities/cron')
    startCronJobs()
  }
}
