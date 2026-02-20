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
 * Fetch latest videos from a YouTube channel, skipping any video IDs in the
 * provided set.  The function paginates through the channel's video feed until
 * it collects `maxResults` *new* videos or runs out of pages.
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
    // Use a loose type so we can reassign to the continuation object
    let feed: { videos: any[]; has_continuation: boolean; getContinuation: () => Promise<any> } =
      await channel.getVideos()

    const results: YouTubeVideoData[] = []
    let page = 0

    while (results.length < maxResults && page < MAX_PAGES) {
      page++

      for (const video of feed.videos) {
        if (results.length >= maxResults) break
        if (!video || !('id' in video) || !video.id) continue

        const videoId = video.id

        // Skip videos we already know about
        if (skipVideoIds.has(videoId)) continue

        const title = ('title' in video && video.title?.toString()) || ''
        const description =
          ('description_snippet' in video && video.description_snippet?.toString()) || ''
        const thumbnailUrl =
          ('thumbnails' in video && video.thumbnails?.[0]?.url) ||
          `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`

        // Handle duration - it might be an object with seconds property or a string
        let duration = ''
        if ('duration' in video && video.duration) {
          if (typeof video.duration === 'string') {
            duration = video.duration
          } else if (typeof video.duration === 'object' && video.duration !== null) {
            // youtubei.js returns duration as an object with seconds property
            const seconds = (video.duration as any).seconds
            if (typeof seconds === 'number') {
              const minutes = Math.floor(seconds / 60)
              const secs = seconds % 60
              duration = `${minutes}:${secs.toString().padStart(2, '0')}`
            } else {
              duration = String(video.duration)
            }
          } else {
            duration = String(video.duration)
          }
        }

        const viewCount =
          ('view_count' in video && typeof video.view_count === 'number' && video.view_count) || 0

        // Try to get the published date — youtubei.js often returns a relative
        // string like "منذ ٣ أيام" instead of an ISO date, so we must validate it.
        const publishedText = ('published' in video && video.published?.toString()) || ''
        const parsedDate = publishedText ? new Date(publishedText) : null
        const publishedAt =
          parsedDate && !isNaN(parsedDate.getTime())
            ? parsedDate.toISOString()
            : new Date().toISOString()

        results.push({
          videoId,
          title,
          description,
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
