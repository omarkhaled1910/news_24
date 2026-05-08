import { Innertube } from 'youtubei.js'

export interface YouTubeVideoData {
  videoId: string
  title: string
  description: string
  thumbnailUrl: string
  youtubeUrl: string
  publishedAt: string
  duration: string
  viewCount: number
}

let innertubeInstance: Innertube | null = null

async function getInnertube(): Promise<Innertube> {
  if (!innertubeInstance) {
    innertubeInstance = await Innertube.create({
      lang: 'ar',
      location: 'SA',
    })
  }
  return innertubeInstance
}

/**
 * Helper to extract view count from Arabic text like "128 ألف مشاهدة"
 * or English text like "128K views"
 */
function parseViewCount(text: string): number {
  // Remove RTL markers and clean up
  const cleaned = text.replace(/[\u200F\u200E]/g, '').toLowerCase()

  // Arabic patterns
  const arabicMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(ألف|مليون|مليار)?/)
  if (arabicMatch) {
    const num = parseFloat(arabicMatch[1])
    const unit = arabicMatch[2]
    if (unit === 'ألف') return Math.round(num * 1000)
    if (unit === 'مليون') return Math.round(num * 1000000)
    if (unit === 'مليار') return Math.round(num * 1000000000)
    return Math.round(num)
  }

  // English patterns
  const englishMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(k|m|b)?/)
  if (englishMatch) {
    const num = parseFloat(englishMatch[1])
    const unit = englishMatch[2]
    if (unit === 'k') return Math.round(num * 1000)
    if (unit === 'm') return Math.round(num * 1000000)
    if (unit === 'b') return Math.round(num * 1000000000)
    return Math.round(num)
  }

  return 0
}

/**
 * Fetch latest videos from a YouTube channel, skipping any video IDs in the
 * provided set.  The function paginates through the channel's video feed until
 * it collects `maxResults` *new* videos or runs out of pages.
 *
 * Note: Updated for youtubei.js v17 which uses a new LockupView structure.
 */
export async function fetchChannelVideos(
  channelId: string,
  maxResults: number = 10,
  skipVideoIds: Set<string> = new Set(),
): Promise<YouTubeVideoData[]> {
  const MAX_PAGES = 5 // safety cap to avoid infinite pagination

  try {
    const yt = await getInnertube()
    const channel = await yt.getChannel(channelId)
    // Use a loose type to handle both old and new response structures
    let feed: any = await channel.getVideos()

    const results: YouTubeVideoData[] = []
    let page = 0

    while (results.length < maxResults && page < MAX_PAGES) {
      page++

      // Handle v17 structure: feed.current_tab.content.contents is array of RichItem
      let videos: any[] = []

      if (feed.current_tab?.content?.contents) {
        // v17 structure - each item is a RichItem with LockupView content
        videos = feed.current_tab.content.contents
      } else if (feed.videos && Array.isArray(feed.videos)) {
        // v16 and older structure
        videos = feed.videos
      }

      for (const item of videos) {
        if (results.length >= maxResults) break

        // Extract video from either RichItem (v17) or direct Video object (v16)
        let video: any
        if (item.type === 'RichItem' && item.content) {
          video = item.content // LockupView in v17
        } else {
          video = item // Direct Video object in v16
        }

        if (!video) continue

        // Get video ID - different structure in v17 vs v16
        const videoId = video.content_id || video.id
        if (!videoId) continue

        // Skip videos we already know about
        if (skipVideoIds.has(videoId)) continue

        // Get title - different structure
        let title = ''
        if (video.metadata?.title?.text) {
          title = video.metadata.title.text
        } else if (video.title) {
          title = video.title.toString()
        }

        // Get thumbnail - different structure
        let thumbnailUrl = ''
        if (video.content_image?.image?.[0]?.url) {
          thumbnailUrl = video.content_image.image[0].url
        } else if (video.thumbnails?.[0]?.url) {
          thumbnailUrl = video.thumbnails[0].url
        } else {
          thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        }

        // Get view count from metadata_rows (v17) or view_count (v16)
        let viewCount = 0
        if (video.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.text) {
          viewCount = parseViewCount(video.metadata.metadata.metadata_rows[0].metadata_parts[0].text.text)
        } else if (typeof video.view_count === 'number') {
          viewCount = video.view_count
        }

        // Get published date from metadata_rows (v17) or published (v16)
        // Note: youtubei.js returns relative strings like "قبل 10 ساعات" which we can't easily parse
        if (video.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[1]?.text?.text) {
          // v17: metadata contains relative date string
        } else if (video.published) {
          // v16: published property
        }

        // Parse date - youtubei.js returns relative strings like "قبل 10 ساعات"
        const publishedAt = new Date().toISOString() // Use current time since we can't parse relative dates accurately

        // Duration is not available in v17 LockupView, would need to call getBasicInfo
        // For now, use empty string - it can be fetched later if needed
        const duration = ''

        results.push({
          videoId,
          title,
          description: '', // Description not available in LockupView
          thumbnailUrl,
          youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
          publishedAt,
          duration,
          viewCount,
        })
      }

      // If we still need more, load the next page
      if (results.length < maxResults && feed.has_continuation) {
        feed = await feed.getContinuation()
      } else {
        break
      }
    }

    return results
  } catch (error) {
    console.error(`Error fetching videos for channel ${channelId}:`, error)
    throw error
  }
}

/**
 * Fetch a single video's details
 */
export async function fetchVideoDetails(videoId: string): Promise<YouTubeVideoData | null> {
  try {
    const yt = await getInnertube()
    const info = await yt.getBasicInfo(videoId)

    if (!info || !info.basic_info) return null

    const { basic_info } = info

    // Handle duration - might be an object with seconds or a string
    let duration = ''
    if (basic_info.duration) {
      if (typeof basic_info.duration === 'string') {
        duration = basic_info.duration
      } else if (typeof basic_info.duration === 'object' && basic_info.duration !== null) {
        const seconds = (basic_info.duration as any).seconds
        if (typeof seconds === 'number') {
          const minutes = Math.floor(seconds / 60)
          const secs = seconds % 60
          duration = `${minutes}:${secs.toString().padStart(2, '0')}`
        } else {
          duration = String(basic_info.duration)
        }
      } else {
        duration = String(basic_info.duration)
      }
    }

    return {
      videoId,
      title: basic_info.title || '',
      description: basic_info.short_description || '',
      thumbnailUrl:
        basic_info.thumbnail?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      publishedAt: new Date().toISOString(),
      duration,
      viewCount: basic_info.view_count || 0,
    }
  } catch (error) {
    console.error(`Error fetching video details for ${videoId}:`, error)
    return null
  }
}
