import cron, { type ScheduledTask } from 'node-cron'
import { getPayload } from 'payload'
import config from '@payload-config'
import { fetchChannelVideos } from './youtube'
import { extractTranscript } from './transcript'
import { generateArticleFromTranscript, convertToLexicalJSON } from './openai'
import { downloadAndUploadThumbnail } from './thumbnailDownloader'

let cronJob: ScheduledTask | null = null

/**
 * Start the automated news cron job.
 * Runs every 5 minutes, picking a random active author each time.
 */
export function startCronJobs(): void {
  if (cronJob) {
    console.log('[Cron] Jobs already running')
    return
  }

  console.log('[Cron] Starting automated news pipeline...')

  // Run every 5 minutes
  cronJob = cron.schedule('*/5 * * * *', async () => {
    console.log('[Cron] Running news pipeline at', new Date().toISOString())
    try {
      await runNewsPipeline()
    } catch (error) {
      console.error('[Cron] Pipeline error:', error)
    }
  })

  // Also run immediately on startup (with a short delay)
  setTimeout(async () => {
    console.log('[Cron] Running initial pipeline...')
    try {
      await runNewsPipeline()
    } catch (error) {
      console.error('[Cron] Initial pipeline error:', error)
    }
  }, 10000) // 10 second delay for server startup

  console.log('[Cron] News pipeline scheduled every 5 minutes')
}

/**
 * Stop the cron jobs
 */
export function stopCronJobs(): void {
  if (cronJob) {
    cronJob.stop()
    cronJob = null
    console.log('[Cron] Jobs stopped')
  }
}

/**
 * Main news pipeline: fetch → transcript → generate → save
 */
export async function runNewsPipeline(): Promise<{
  processed: number
  articles: number
  errors: number
}> {
  const payload = await getPayload({ config })
  let processed = 0
  let articles = 0
  let errors = 0

  try {
    // Step 1: Get all active authors and pick one at random
    const { docs: authors } = await payload.find({
      collection: 'authors',
      where: { active: { equals: true } },
      limit: 100,
    })

    if (authors.length === 0) {
      console.log('[Pipeline] No active authors found')
      return { processed: 0, articles: 0, errors: 0 }
    }

    const author = authors[Math.floor(Math.random() * authors.length)]
    console.log(`[Pipeline] Randomly selected author: "${author.name}" (${authors.length} active)`)

    try {
      // Step 2: Gather all known video IDs for this author so we can skip them
      const { docs: existingVideoDocs } = await payload.find({
        collection: 'videos',
        where: { author: { equals: author.id } },
        limit: 0, // 0 = return all matching docs
        select: { videoId: true },
      })
      const knownVideoIds = new Set(existingVideoDocs.map((v) => v.videoId as string))
      console.log(`[Pipeline] ${knownVideoIds.size} known videos for "${author.name}"`)

      // Step 3: Fetch next batch of new videos (skips known ones automatically)
      const videos = await fetchChannelVideos(author.channelId, 5, knownVideoIds)
      console.log(`[Pipeline] Fetched ${videos.length} new videos from "${author.name}"`)

      for (const videoData of videos) {
        try {

          // Step 4: Save video record
          // Ensure publishedAt is a valid ISO date — YouTube sometimes returns relative strings
          const videoPublishedAt = (() => {
            if (!videoData.publishedAt) return new Date().toISOString()
            const d = new Date(videoData.publishedAt)
            return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
          })()

          const video = await payload.create({
            collection: 'videos',
            data: {
              title: videoData.title,
              videoId: videoData.videoId,
              youtubeUrl: videoData.youtubeUrl,
              author: author.id,
              description: videoData.description,
              thumbnailUrl: videoData.thumbnailUrl,
              duration: videoData.duration,
              publishedAt: videoPublishedAt,
              viewCount: videoData.viewCount,
              status: 'fetched',
            },
          })

          processed++

          // Step 5: Extract transcript
          const language = author.language || 'ar'
          const transcript = await extractTranscript(videoData.videoId, language)

          if (!transcript) {
            await payload.update({
              collection: 'videos',
              id: video.id,
              data: { status: 'no_transcript' },
            })
            console.log(`[Pipeline] No transcript for: ${videoData.title}`)
            continue
          }

          await payload.update({
            collection: 'videos',
            id: video.id,
            data: {
              transcript,
              transcriptLanguage: language,
              status: 'transcribed',
            },
          })

          // Step 6: Generate article using OpenAI
          if (!process.env.OPENAI_API_KEY) {
            console.warn('[Pipeline] OPENAI_API_KEY not set, skipping article generation')
            continue
          }

          const generatedArticle = await generateArticleFromTranscript(
            transcript,
            videoData.title,
            author.name,
            videoData.youtubeUrl,
          )

          // Step 7: Download and upload thumbnail as hero image
          let heroImageId: string | null = null
          if (videoData.thumbnailUrl) {
            heroImageId = await downloadAndUploadThumbnail(
              videoData.thumbnailUrl,
              videoData.title,
              payload,
            )
          }

          // Step 8: Convert content to Lexical JSON format
          const lexicalContent = convertToLexicalJSON(generatedArticle.content)

          // Step 9: Create article
          const articleData: Record<string, unknown> = {
            title: generatedArticle.title,
            excerpt: generatedArticle.excerpt,
            content: lexicalContent,
            authorName: author.name,
            author: author.id,
            sourceVideo: video.id,
            youtubeUrl: videoData.youtubeUrl,
            publishedAt: new Date().toISOString(),
            isAutoGenerated: true,
            featured: false,
            breakingNews: false,
            tags: generatedArticle.tags.map((tag) => ({ tag })),
            _status: 'published',
          }

          if (heroImageId) {
            articleData.heroImage = heroImageId
          }

          await payload.create({
            collection: 'articles',
            data: articleData as any,
            draft: false,
          })

          // Update video status
          await payload.update({
            collection: 'videos',
            id: video.id,
            data: { status: 'article_generated' },
          })

          articles++
          console.log(`[Pipeline] Article created: "${generatedArticle.title}"`)
        } catch (videoError) {
          errors++
          console.error(
            `[Pipeline] Error processing video ${videoData.videoId}:`,
            videoError,
          )
        }
      }

      // Update author's last fetched timestamp
      await payload.update({
        collection: 'authors',
        id: author.id,
        data: {
          lastFetchedAt: new Date().toISOString(),
          fetchCount: (author.fetchCount || 0) + 1,
        },
      })
    } catch (channelError) {
      errors++
      console.error(`[Pipeline] Error processing author ${author.name}:`, channelError)
    }

    console.log(
      `[Pipeline] Complete: ${processed} videos processed, ${articles} articles created, ${errors} errors`,
    )
  } catch (error) {
    console.error('[Pipeline] Critical error:', error)
    errors++
  }

  return { processed, articles, errors }
}
