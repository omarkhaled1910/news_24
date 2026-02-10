import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

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
      payload.logger.error(`Error revalidating article: ${error}`)
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
