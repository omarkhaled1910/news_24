import { getPayload } from 'payload'
import config from '@payload-config'
import {
  fetchChannelVideos,
  fetchChannelLiveVideos,
  isYouTubeRateLimitError,
  type YouTubeVideoData,
} from './youtube'
import { extractTranscript } from './transcript'
import { generateArticleFromTranscript, convertToLexicalJSON } from './openai'
import { downloadAndUploadThumbnail } from './thumbnailDownloader'
import { slugifyArabicText } from '@/collections/Articles'
import type { Author, Video } from '@/payload-types'

// ---------------------------------------------------------------------------
// Adaptive scheduler
// ---------------------------------------------------------------------------
// A fixed 5-minute cron interval doesn't account for two realities: a single
// run can take much longer than 5 minutes (reasoning models like DeepSeek R1
// can take minutes per article), and hammering YouTube on a fixed cadence
// risks/worsens 429 "too many requests" rate-limiting. So instead of
// node-cron's fixed schedule, this self-reschedules after each run: a normal
// (jittered) ~5 min delay after a clean run, or an exponentially growing
// backoff — reset after the next clean run — whenever YouTube rate-limits us.
const BASE_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const RATE_LIMIT_BACKOFF_START_MS = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_BACKOFF_MAX_MS = 2 * 60 * 60 * 1000 // 2 hours
const JITTER_RATIO = 0.2 // +/-20%, avoids a perfectly predictable request cadence

let scheduledTimeout: NodeJS.Timeout | null = null
let pipelineRunning = false
let currentBackoffMs = RATE_LIMIT_BACKOFF_START_MS

function withJitter(ms: number): number {
  const jitter = ms * JITTER_RATIO
  return Math.round(ms - jitter + Math.random() * jitter * 2)
}

/**
 * Run the pipeline, skipping if a previous run is still in progress. Some
 * models (e.g. reasoning models like DeepSeek R1 via OpenRouter) can take
 * several minutes per article — comfortably longer than the base interval —
 * so without this guard, overlapping runs could pick the same author/videos
 * concurrently and waste API calls.
 */
async function runNewsPipelineGuarded(): Promise<Awaited<ReturnType<typeof runNewsPipeline>> | null> {
  if (pipelineRunning) {
    console.log('[Cron] Previous pipeline run still in progress, skipping this tick')
    return null
  }
  pipelineRunning = true
  try {
    return await runNewsPipeline()
  } finally {
    pipelineRunning = false
  }
}

async function runAndReschedule(): Promise<void> {
  console.log('[Cron] Running news pipeline at', new Date().toISOString())
  let nextDelay = withJitter(BASE_INTERVAL_MS)
  try {
    const result = await runNewsPipelineGuarded()
    if (result?.youtubeRateLimited) {
      nextDelay = withJitter(currentBackoffMs)
      console.warn(
        `[Cron] YouTube rate-limited this run — backing off ~${Math.round(nextDelay / 60000)} min before the next run`,
      )
      currentBackoffMs = Math.min(currentBackoffMs * 2, RATE_LIMIT_BACKOFF_MAX_MS)
    } else if (result) {
      currentBackoffMs = RATE_LIMIT_BACKOFF_START_MS // reset backoff after a clean run
    }
  } catch (error) {
    console.error('[Cron] Pipeline error:', error)
  }
  scheduledTimeout = setTimeout(runAndReschedule, nextDelay)
}

/**
 * Start the automated news cron job.
 * Self-reschedules after each run (~5 min baseline, backing off when
 * YouTube rate-limits us) rather than running on a fixed interval.
 */
export function startCronJobs(): void {
  if (scheduledTimeout) {
    console.log('[Cron] Jobs already running')
    return
  }

  console.log('[Cron] Starting automated news pipeline...')
  currentBackoffMs = RATE_LIMIT_BACKOFF_START_MS
  scheduledTimeout = setTimeout(runAndReschedule, 10000) // 10 second delay for server startup

  console.log('[Cron] News pipeline scheduled (adaptive interval, ~5 min baseline)')
}

/**
 * Stop the cron jobs
 */
export function stopCronJobs(): void {
  if (scheduledTimeout) {
    clearTimeout(scheduledTimeout)
    scheduledTimeout = null
    console.log('[Cron] Jobs stopped')
  }
}

/**
 * Get a fresh payload instance to avoid connection timeout issues
 * This is important for long-running cron jobs
 */
async function getFreshPayload() {
  return await getPayload({ config })
}

/**
 * Detect a Payload ValidationError caused by the `slug` field's unique
 * constraint (MongoDB E11000), as opposed to any other validation failure.
 */
function isDuplicateSlugError(error: unknown): boolean {
  const err = error as { data?: { errors?: { path?: string; message?: string }[] } }
  return (
    err?.data?.errors?.some(
      (e) => e.path === 'slug' && (e.message ?? '').toLowerCase().includes('unique'),
    ) ?? false
  )
}

/**
 * A unit of work for the pipeline: either a brand-new video discovered from
 * YouTube (uploads or live tab), or a pre-existing `videos` record that never
 * made it to `article_generated` (backlog fallback when nothing new was found).
 */
type WorkItem =
  | { kind: 'new'; data: YouTubeVideoData }
  | { kind: 'backlog'; video: Video }

/**
 * Process a single work item: ensure a video record exists, extract a
 * transcript if missing, and generate + publish an article if missing.
 * Returns whether a video record was newly created and whether an article
 * was generated, so the caller can update pipeline counters.
 */
async function processWorkItem(
  item: WorkItem,
  author: Author,
): Promise<{ videoCreated: boolean; articleCreated: boolean }> {
  const language = author.language || 'ar'
  let videoId: string
  let video: Video

  if (item.kind === 'new') {
    const videoData = item.data
    videoId = videoData.videoId

    // Ensure publishedAt is a valid ISO date — YouTube sometimes returns relative strings
    const videoPublishedAt = (() => {
      if (!videoData.publishedAt) return new Date().toISOString()
      const d = new Date(videoData.publishedAt)
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
    })()

    const payloadCreate = await getFreshPayload()
    video = await payloadCreate.create({
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
  } else {
    video = item.video
    videoId = video.videoId
  }

  const videoCreated = item.kind === 'new'

  try {
    // Extract transcript if we don't already have one for this video
    let transcript: string | null = null
    if (video.status === 'article_generated') {
      // Shouldn't happen (backlog query excludes these), but guard anyway
      return { videoCreated, articleCreated: false }
    }

    if (video.status === 'transcribed' && video.transcript) {
      // Already transcribed in a previous run (e.g. article generation was
      // skipped earlier because the OpenAI key was missing) — re-extract the
      // full transcript since the stored copy may be truncated to 5000 chars.
      transcript = await extractTranscript(videoId, language)
    } else {
      transcript = await extractTranscript(videoId, language)

      const payloadT = await getFreshPayload()
      if (!transcript) {
        await payloadT.update({
          collection: 'videos',
          id: video.id,
          data: { status: 'no_transcript' },
        })
        console.log(`[Pipeline] No transcript for: ${video.title}`)
        return { videoCreated, articleCreated: false }
      }

      const truncatedTranscript =
        transcript.slice(0, 5000) + (transcript.length > 5000 ? '...' : '')
      await payloadT.update({
        collection: 'videos',
        id: video.id,
        data: {
          transcript: truncatedTranscript,
          transcriptLanguage: language,
          status: 'transcribed',
        },
      })
    }

    if (!transcript) {
      return { videoCreated, articleCreated: false }
    }

    // Generate article using OpenAI
    if (!process.env.NEXT_PRIVATE_OPENAI_API_KEY) {
      console.warn('[Pipeline] OPENAI_API_KEY not set, skipping article generation')
      return { videoCreated, articleCreated: false }
    }

    const youtubeUrl = video.youtubeUrl || `https://www.youtube.com/watch?v=${videoId}`

    const generatedArticle = await generateArticleFromTranscript(
      transcript,
      video.title,
      author.name,
      youtubeUrl,
      author.language || 'ar',
      author.aiModel,
    )

    // Download and upload thumbnail as hero image
    let heroImageId: string | null = null
    if (video.thumbnailUrl) {
      const payloadThumb = await getFreshPayload()
      heroImageId = await downloadAndUploadThumbnail(video.thumbnailUrl, video.title, payloadThumb)
    }

    // Convert content to Lexical JSON format
    const lexicalContent = convertToLexicalJSON(
      generatedArticle.content,
      author.language === 'en' ? 'ltr' : 'rtl',
    )

    // Truncate transcript for Article (textarea has limits, but keep more than Video preview)
    const articleTranscript =
      transcript.slice(0, 15000) + (transcript.length > 15000 ? '...' : '')
    const articleData: Record<string, unknown> = {
      title: generatedArticle.title,
      excerpt: generatedArticle.excerpt,
      content: lexicalContent,
      authorName: author.name,
      author: author.id,
      sourceVideo: video.id,
      youtubeUrl,
      publishedAt: new Date().toISOString(),
      isAutoGenerated: true,
      aiModel: generatedArticle.aiModel,
      featured: false,
      breakingNews: false,
      tags: generatedArticle.tags.map((tag) => ({ tag })),
      transcript: articleTranscript,
      transcriptLanguage: language,
      _status: 'published',
    }

    if (heroImageId) {
      articleData.heroImage = heroImageId
    }

    // Assign author's category to article
    if (author.category) {
      articleData.categories = [author.category]
    }

    // OpenAI-generated titles for videos on the same topic can collide after
    // slugifying (the `slug` field is unique) — retry with a numbered suffix
    // rather than losing the whole article.
    const baseSlug = slugifyArabicText(generatedArticle.title)
    const MAX_SLUG_ATTEMPTS = 5
    for (let attempt = 0; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
      const payloadArticle = await getFreshPayload()
      try {
        await payloadArticle.create({
          collection: 'articles',
          data: {
            ...articleData,
            ...(attempt > 0 ? { slug: `${baseSlug}-${attempt + 1}` } : {}),
          } as any,
          draft: false,
        })
        break
      } catch (createError) {
        if (!isDuplicateSlugError(createError) || attempt === MAX_SLUG_ATTEMPTS) {
          throw createError
        }
        console.warn(
          `[Pipeline] Slug collision for "${generatedArticle.title}", retrying with suffix -${attempt + 2}`,
        )
      }
    }

    // Update video status
    const payloadStatus = await getFreshPayload()
    await payloadStatus.update({
      collection: 'videos',
      id: video.id,
      data: { status: 'article_generated' },
    })

    console.log(`[Pipeline] Article created: "${generatedArticle.title}"`)
    return { videoCreated, articleCreated: true }
  } catch (videoError) {
    console.error(`[Pipeline] Error processing video ${videoId}:`, videoError)
    throw videoError
  }
}

/**
 * Main news pipeline: fetch → transcript → generate → save
 */
export async function runNewsPipeline(): Promise<{
  processed: number
  articles: number
  errors: number
  youtubeRateLimited: boolean
}> {
  let processed = 0
  let articles = 0
  let errors = 0
  let youtubeRateLimited = false

  try {
    // Step 1: Get all active authors and pick one at random
    const payload = await getFreshPayload()
    const { docs: authors } = await payload.find({
      collection: 'authors',
      where: { active: { equals: true } },
      limit: 100,
      depth: 1, // Populate category relationship
    })

    if (authors.length === 0) {
      console.log('[Pipeline] No active authors found')
      return { processed: 0, articles: 0, errors: 0, youtubeRateLimited: false }
    }

    const author = authors[Math.floor(Math.random() * authors.length)]
    console.log(`[Pipeline] Randomly selected author: "${author.name}" (${authors.length} active)`)

    try {
      // Step 2: Gather all known video IDs for this author so we can skip them
      const payload2 = await getFreshPayload()
      const { docs: existingVideoDocs } = await payload2.find({
        collection: 'videos',
        where: { author: { equals: author.id } },
        limit: 0, // 0 = return all matching docs
        select: { videoId: true },
      })
      const knownVideoIds = new Set(existingVideoDocs.map((v) => v.videoId as string))
      console.log(`[Pipeline] ${knownVideoIds.size} known videos for "${author.name}"`)

      // Step 3: Fetch next batch of new uploaded videos (skips known ones automatically)
      let newVideos: YouTubeVideoData[] = []
      try {
        newVideos = await fetchChannelVideos(author.channelId, 5, knownVideoIds)
        console.log(`[Pipeline] Fetched ${newVideos.length} new videos from "${author.name}"`)
      } catch (fetchError) {
        if (isYouTubeRateLimitError(fetchError)) {
          youtubeRateLimited = true
          console.warn(
            `[Pipeline] YouTube rate-limited while fetching videos for "${author.name}" — falling back to backlog this run`,
          )
        } else {
          throw fetchError
        }
      }

      // Step 3b: Also check the channel's Live tab every cycle for new or
      // finished livestreams (in-progress lives are filtered out already).
      // Skipped if we're already rate-limited — no point making it worse.
      let liveVideos: YouTubeVideoData[] = []
      if (!youtubeRateLimited) {
        try {
          const seenIds = new Set([...knownVideoIds, ...newVideos.map((v) => v.videoId)])
          liveVideos = await fetchChannelLiveVideos(author.channelId, 5, seenIds)
          if (liveVideos.length > 0) {
            console.log(`[Pipeline] Fetched ${liveVideos.length} live video(s) from "${author.name}"`)
          }
        } catch (liveError) {
          if (isYouTubeRateLimitError(liveError)) {
            youtubeRateLimited = true
            console.warn(
              `[Pipeline] YouTube rate-limited while fetching live streams for "${author.name}"`,
            )
          } else {
            console.error(`[Pipeline] Error fetching live streams for "${author.name}":`, liveError)
          }
        }
      }

      let workItems: WorkItem[] = [...newVideos, ...liveVideos].map((data) => ({
        kind: 'new',
        data,
      }))

      // Step 3c: Fallback — if nothing new was uploaded or is live, reprocess
      // backlog videos that never made it to `article_generated` (e.g. no
      // transcript was available yet, or article generation was skipped).
      if (workItems.length === 0) {
        const payloadBacklog = await getFreshPayload()
        const { docs: backlogVideos } = await payloadBacklog.find({
          collection: 'videos',
          where: {
            author: { equals: author.id },
            status: { not_equals: 'article_generated' },
          },
          limit: 5,
          sort: '-createdAt',
        })

        if (backlogVideos.length > 0) {
          console.log(
            `[Pipeline] No new/live videos — falling back to ${backlogVideos.length} backlog video(s) for "${author.name}"`,
          )
          workItems = backlogVideos.map((video) => ({ kind: 'backlog', video }))
        }
      }

      for (const item of workItems) {
        try {
          const result = await processWorkItem(item, author)
          if (result.videoCreated) processed++
          if (result.articleCreated) articles++
        } catch (workError) {
          errors++
          const videoId = item.kind === 'new' ? item.data.videoId : item.video.videoId
          console.error(`[Pipeline] Error processing video ${videoId}:`, workError)
        }
      }

      // Update author's last fetched timestamp
      const payload9 = await getFreshPayload()
      await payload9.update({
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

  return { processed, articles, errors, youtubeRateLimited }
}
