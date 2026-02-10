import { Innertube } from 'youtubei.js'

export interface YouTubeChannelMetadata {
  channelId: string
  name: string
  handle?: string
  thumbnailUrl: string
  description: string
  subscriberCount: number
  videoCount: number
  viewCount: number
  country?: string
  joinedDate?: string
  keywords?: string[]
  bannerUrl?: string
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
 * Fetch detailed metadata from a YouTube channel
 * @param channelId - The YouTube channel ID (e.g., UCxxxxxxx)
 * @returns Channel metadata or null if fetch fails
 */
export async function fetchChannelMetadata(
  channelId: string,
): Promise<YouTubeChannelMetadata | null> {
  try {
    const yt = await getInnertube()
    const channel = await yt.getChannel(channelId)

    if (!channel) {
      console.error(`Channel not found: ${channelId}`)
      return null
    }

    // Get channel metadata
    const metadata = channel.metadata as any
    const channelName = metadata?.title || ''
    const channelDescription = metadata?.description || ''
    const channelThumbnail = metadata?.thumbnail?.[0]?.url || ''
    const channelBanner = metadata?.banner?.[0]?.url || ''
    const channelHandle = metadata?.handle || ''

    // Get channel stats
    const subscriberCount = metadata?.subscriber_count || 0
    const videoCount = metadata?.videos_count || 0
    const viewCount = metadata?.views_count || 0

    // Get channel keywords/tags
    const keywords = metadata?.keywords || []

    // Get channel country
    const country = metadata?.country || ''

    // Get joined date
    const joinedDate = metadata?.joined_date || ''

    return {
      channelId,
      name: channelName,
      handle: channelHandle,
      thumbnailUrl: channelThumbnail,
      description: channelDescription,
      subscriberCount,
      videoCount,
      viewCount,
      country,
      joinedDate,
      keywords,
      bannerUrl: channelBanner,
    }
  } catch (error) {
    console.error(`Error fetching metadata for channel ${channelId}:`, error)
    return null
  }
}

/**
 * Format subscriber count for display (e.g., 1200000 -> 1.2M)
 */
export function formatSubscriberCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

/**
 * Format view count for display
 */
export function formatViewCount(count: number): string {
  return formatSubscriberCount(count)
}
