import { YoutubeTranscript } from 'youtube-transcript'
import { getSubtitles } from 'youtube-caption-scraper'

export interface TranscriptSegment {
  text: string
  offset: number
  duration: number
}

/**
 * Extract transcript from a YouTube video.
 * Uses youtube-transcript as primary method, falls back to youtube-caption-scraper.
 */
export async function extractTranscript(
  videoId: string,
  language: string = 'ar',
): Promise<string | null> {
  // Method 1: youtube-transcript
  const primary = await extractWithYoutubeTranscript(videoId, language)
  if (primary) return primary

  // Method 2: youtube-caption-scraper (fallback)
  const fallback = await extractWithCaptionScraper(videoId, language)
  if (fallback) return fallback

  // Method 3: Try without language filter (auto-generated captions)
  const autoTranscript = await extractWithYoutubeTranscript(videoId)
  if (autoTranscript) return autoTranscript

  console.warn(`No transcript available for video ${videoId}`)
  return null
}

/**
 * Primary: youtube-transcript package
 */
async function extractWithYoutubeTranscript(
  videoId: string,
  language?: string,
): Promise<string | null> {
  try {
    const config: { lang?: string } = {}
    if (language) {
      config.lang = language
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId, config)

    if (!transcript || transcript.length === 0) {
      return null
    }

    // Join all segments into a single text
    const fullText = transcript
      .map((segment) => segment.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    return fullText || null
  } catch (error) {
    console.warn(`youtube-transcript failed for ${videoId}:`, (error as Error).message)
    return null
  }
}

/**
 * Fallback: youtube-caption-scraper package
 */
async function extractWithCaptionScraper(
  videoId: string,
  language: string = 'ar',
): Promise<string | null> {
  try {
    const captions = await getSubtitles({
      videoID: videoId,
      lang: language,
    })

    if (!captions || captions.length === 0) {
      return null
    }

    const fullText = captions
      .map((caption: { text: string }) => caption.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    return fullText || null
  } catch (error) {
    console.warn(`youtube-caption-scraper failed for ${videoId}:`, (error as Error).message)
    return null
  }
}
