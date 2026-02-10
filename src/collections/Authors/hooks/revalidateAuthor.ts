import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

export const revalidateAuthor: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/authors/${doc.slug}`

      payload.logger.info(`Revalidating author at path: ${path}`)

      revalidatePath(path)
      revalidateTag('authors-sitemap')
      revalidateTag('authors-listing')
    }

    // If the author was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const oldPath = `/authors/${previousDoc.slug}`

      payload.logger.info(`Revalidating old author at path: ${oldPath}`)

      revalidatePath(oldPath)
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/authors/${doc?.slug}`
    revalidatePath(path)
    revalidateTag('authors-listing')
  }

  return doc
}
