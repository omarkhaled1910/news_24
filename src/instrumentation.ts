/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts.
 * Used to initialize the automated news cron job.
 */
export async function register() {
  // Only run on the Node.js server runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startCronJobs } = await import('./utilities/cron')
    startCronJobs()
  }
}
