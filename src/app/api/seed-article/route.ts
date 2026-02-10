import { createLocalReq, getPayload } from 'payload'
import { article1 } from '@/endpoints/seed/article-1'
import config from '@payload-config'
import { headers } from 'next/headers'

export const maxDuration = 60

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  // Authenticate by passing request headers
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    // Create a Payload request object
    const payloadReq = await createLocalReq({ user }, payload)

    payload.logger.info('Seeding article...')

    // Fetch the first active author (authors collection has no drafts, so no _status field)
    const authors = await payload.find({
      collection: 'authors',
      where: {
        active: { equals: true },
      },
      limit: 1,
      req: payloadReq,
    })

    const author = authors.docs[0]

    if (!author) {
      payload.logger.warn('No active authors found. Creating article without author relationship.')
    }

    // Check if article already exists by slug
    const existingArticle = await payload.find({
      collection: 'articles',
      where: {
        slug: { equals: 'مقال-تجريبي' },
      },
      limit: 1,
      req: payloadReq,
    })

    if (existingArticle.docs.length > 0) {
      payload.logger.info('Article already exists. Updating...')

      // Update existing article
      const updated = await payload.update({
        collection: 'articles',
        id: existingArticle.docs[0].id,
        data: article1({ author }),
        req: payloadReq,
      })

      return Response.json({
        success: true,
        message: 'Article updated successfully',
        article: {
          id: updated.id,
          title: updated.title,
          slug: updated.slug,
        },
      })
    }

    // Create new article
    const article = await payload.create({
      collection: 'articles',
      data: article1({ author }),
      req: payloadReq,
    })

    payload.logger.info(`Article created: ${article.title}`)

    return Response.json({
      success: true,
      message: 'Article seeded successfully',
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        url: `/articles/${article.slug}`,
      },
    })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error seeding article' })
    return new Response(`Error seeding article: ${e instanceof Error ? e.message : 'Unknown error'}`, {
      status: 500,
    })
  }
}
