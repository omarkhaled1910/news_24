import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * `revalidatePath`/`revalidateTag` only work inside an active Next.js request
 * (they read from a request-scoped store). The news pipeline can run outside
 * any request — e.g. the in-process node-cron scheduler in `utilities/cron.ts`
 * — in which case this throws. That's expected there, not a real failure: the
 * article page itself is `force-dynamic` (always fresh) and the homepage has
 * a 60s time-based fallback, so content still shows up shortly either way.
 */
function isMissingRequestContextError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('static generation store missing')
}

export const revalidateArticle: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    try {
      if (doc._status === 'published') {
        const path = `/articles/${doc.slug}`

        payload.logger.info(`Revalidating article at path: ${path}`)

        revalidatePath(path)
        revalidateTag('articles-sitemap')
        revalidateTag('homepage')
      }

      // If the article was previously published, we need to revalidate the old path
      if (previousDoc?._status === 'published' && doc._status !== 'published') {
        const oldPath = `/articles/${previousDoc.slug}`

        payload.logger.info(`Revalidating old article at path: ${oldPath}`)

        revalidatePath(oldPath)
        revalidateTag('homepage')
      }
    } catch (error) {
      if (isMissingRequestContextError(error)) {
        payload.logger.info(
          'Skipped revalidation (no active request context, e.g. a background cron run) — relying on time-based revalidation instead',
        )
      } else {
        payload.logger.error(`Error revalidating article: ${error}`)
      }
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook = ({ doc, req: { context, payload } }) => {
  if (!context.disableRevalidate) {
    try {
      const path = `/articles/${doc?.slug}`
      revalidatePath(path)
      revalidateTag('homepage')
    } catch (error) {
      payload?.logger?.error?.(`Error revalidating deleted article: ${error}`)
    }
  }

  return doc
}
