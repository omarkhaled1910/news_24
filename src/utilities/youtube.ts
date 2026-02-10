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
 * Fetch latest videos from a YouTube channel
 */
export async function fetchChannelVideos(
  channelId: string,
  maxResults: number = 10,
): Promise<YouTubeVideoData[]> {
  try {
    const yt = await getInnertube()
    const channel = await yt.getChannel(channelId)
    const videos = await channel.getVideos()

    const results: YouTubeVideoData[] = []

    for (const video of videos.videos.slice(0, maxResults)) {
      if (!video || !('id' in video) || !video.id) continue

      const videoId = video.id
      const title = ('title' in video && video.title?.toString()) || ''
      const description =
        ('description_snippet' in video && video.description_snippet?.toString()) || ''
      const thumbnailUrl =
        ('thumbnails' in video && video.thumbnails?.[0]?.url) ||
        `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
      const duration = ('duration' in video && video.duration?.toString()) || ''
      const viewCount =
        ('view_count' in video && typeof video.view_count === 'number' && video.view_count) || 0

      // Try to get the published date
      const publishedText = ('published' in video && video.published?.toString()) || ''

      results.push({
        videoId,
        title,
        description,
        thumbnailUrl,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: publishedText || new Date().toISOString(),
        duration,
        viewCount,
      })
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

    return {
      videoId,
      title: basic_info.title || '',
      description: basic_info.short_description || '',
      thumbnailUrl:
        basic_info.thumbnail?.[0]?.url ||
        `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      publishedAt: new Date().toISOString(),
      duration: basic_info.duration?.toString() || '',
      viewCount: basic_info.view_count || 0,
    }
  } catch (error) {
    console.error(`Error fetching video details for ${videoId}:`, error)
    return null
  }
}
