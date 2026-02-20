import { BeforeSync, DocToSync } from '@payloadcms/plugin-search/types'

export const beforeSyncWithSearch: BeforeSync = async ({ req, originalDoc, searchDoc }) => {
  const {
    doc: { relationTo: collection },
  } = searchDoc

  const { slug, id, categories, title, meta, heroImage } = originalDoc

  // Use meta.image if available, otherwise fall back to heroImage (used by articles)
  const imageId = meta?.image?.id || meta?.image || heroImage?.id || heroImage || undefined

  const modifiedDoc: DocToSync = {
    ...searchDoc,
    slug,
    meta: {
      ...meta,
      title: meta?.title || title,
      image: imageId,
      description: meta?.description || originalDoc.excerpt,
    },
    categories: [],
  }

  if (categories && Array.isArray(categories) && categories.length > 0) {
    const populatedCategories: Array<{
      id: string | number
      categoryEn?: string
      categoryAr?: string
    }> = []
    for (const category of categories) {
      if (!category) {
        continue
      }

      if (typeof category === 'object') {
        populatedCategories.push(category as any)
        continue
      }

      const doc = await req.payload.findByID({
        collection: 'categories',
        id: category,
        disableErrors: true,
        depth: 0,
        select: { categoryEn: true, categoryAr: true },
        req,
      })

      if (doc !== null) {
        populatedCategories.push(doc as any)
      } else {
        console.error(
          `Failed. Category not found when syncing collection '${collection}' with id: '${id}' to search.`,
        )
      }
    }

    modifiedDoc.categories = populatedCategories.map((each) => ({
      relationTo: 'categories',
      categoryID: String(each.id),
      categoryEn: each.categoryEn,
      categoryAr: each.categoryAr,
    }))
  }

  return modifiedDoc
}
