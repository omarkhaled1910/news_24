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
 * Runs every 30 minutes to fetch new videos, extract transcripts,
 * generate articles, and save them to the database.
 */
export function startCronJobs(): void {
  if (cronJob) {
    console.log('[Cron] Jobs already running')
    return
  }

  console.log('[Cron] Starting automated news pipeline...')

  // Run every 30 minutes
  cronJob = cron.schedule('*/30 * * * *', async () => {
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

  console.log('[Cron] News pipeline scheduled every 30 minutes')
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
    // Step 1: Get all active channels
    const { docs: channels } = await payload.find({
      collection: 'channels',
      where: { active: { equals: true } },
      limit: 100,
    })

    if (channels.length === 0) {
      console.log('[Pipeline] No active channels found')
      return { processed: 0, articles: 0, errors: 0 }
    }

    console.log(`[Pipeline] Processing ${channels.length} active channels`)

    for (const channel of channels) {
      try {
        // Step 2: Fetch latest videos from channel
        const videos = await fetchChannelVideos(channel.channelId, 5)
        console.log(`[Pipeline] Fetched ${videos.length} videos from "${channel.name}"`)

        for (const videoData of videos) {
          try {
            // Step 3: Check if video already exists
            const { docs: existingVideos } = await payload.find({
              collection: 'videos',
              where: { videoId: { equals: videoData.videoId } },
              limit: 1,
            })

            if (existingVideos.length > 0) {
              console.log(`[Pipeline] Skipping existing video: ${videoData.videoId}`)
              continue
            }

            // Step 4: Save video record
            const video = await payload.create({
              collection: 'videos',
              data: {
                title: videoData.title,
                videoId: videoData.videoId,
                youtubeUrl: videoData.youtubeUrl,
                channel: channel.id,
                description: videoData.description,
                thumbnailUrl: videoData.thumbnailUrl,
                duration: videoData.duration,
                publishedAt: videoData.publishedAt || new Date().toISOString(),
                viewCount: videoData.viewCount,
                status: 'fetched',
              },
            })

            processed++

            // Step 5: Extract transcript
            const language = channel.language || 'ar'
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
              channel.name,
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
              authorName: channel.name,
              channel: channel.id,
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

            // Generate slug from title
            const slug = generatedArticle.title
              .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, '')
              .replace(/\s+/g, '-')
              .substring(0, 100)
              .toLowerCase()

            articleData.slug = `${slug}-${Date.now()}`

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

        // Update channel's last fetched timestamp
        await payload.update({
          collection: 'channels',
          id: channel.id,
          data: {
            lastFetchedAt: new Date().toISOString(),
            fetchCount: (channel.fetchCount || 0) + 1,
          },
        })
      } catch (channelError) {
        errors++
        console.error(`[Pipeline] Error processing channel ${channel.name}:`, channelError)
      }
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
