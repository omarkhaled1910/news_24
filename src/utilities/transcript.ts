import { exec } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const MAX_RETRIES = 3
const RETRY_BASE_DELAY_MS = 5_000
const COMMAND_TIMEOUT_MS = 90_000

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Json3Event {
  tStartMs?: number
  segs?: { utf8?: string }[]
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract transcript from a YouTube video using yt-dlp.
 *
 * Strategy:
 *   1. Try the requested language (manual + auto-generated subs)
 *   2. Fall back to any available auto-generated subs
 *
 * Returns the transcript as a plain-text string, or null if unavailable.
 */
export async function extractTranscript(
  videoId: string,
  language: string = 'ar',
): Promise<string | null> {
  // Method 1: requested language
  const primary = await fetchWithYtDlp(videoId, language)
  if (primary) return primary

  // Method 2: fallback — any auto-generated subs
  const fallback = await fetchWithYtDlp(videoId, language, true)
  if (fallback) return fallback

  console.warn(`[Transcript] No transcript available for video ${videoId}`)
  return null
}

// ---------------------------------------------------------------------------
// yt-dlp integration
// ---------------------------------------------------------------------------

/**
 * Download subtitles with yt-dlp, parse them, and return the text.
 * Uses a temp directory that is cleaned up automatically.
 */
async function fetchWithYtDlp(
  videoId: string,
  language: string,
  anyLanguage: boolean = false,
): Promise<string | null> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `yt-transcript-${videoId}-`))

  try {
    const outputTemplate = path.join(tmpDir, `${videoId}.%(ext)s`)
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

    // Build yt-dlp command
    const langFlag = anyLanguage ? '' : `--sub-lang ${language}`
    const command = [
      'yt-dlp',
      '--write-subs',
      '--write-auto-subs',
      '--skip-download',
      langFlag,
      '--sub-format json3',
      `-o "${outputTemplate}"`,
      `"${videoUrl}"`,
    ]
      .filter(Boolean)
      .join(' ')

    const result = await runWithRetry(command)

    // Check if yt-dlp reported no subtitles
    if (
      result.stderr.includes('There are no subtitles') ||
      result.stderr.includes('Subtitles are not available')
    ) {
      return null
    }

    // Find the downloaded subtitle file
    const files = await fs.readdir(tmpDir)
    const subtitleFile = files.find(
      (f) => f.startsWith(videoId) && (f.endsWith('.json3') || f.endsWith('.vtt')),
    )

    if (!subtitleFile) return null

    const content = await fs.readFile(path.join(tmpDir, subtitleFile), 'utf-8')

    if (subtitleFile.endsWith('.json3')) {
      return parseJson3(content)
    }

    // VTT fallback — strip timing lines and return plain text
    return parseVtt(content)
  } catch (error) {
    console.warn(
      `[Transcript] yt-dlp failed for ${videoId} (lang=${language}, any=${anyLanguage}):`,
      (error as Error).message,
    )
    return null
  } finally {
    // Clean up temp directory
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function runWithRetry(
  command: string,
): Promise<{ stdout: string; stderr: string }> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await execAsync(command, {
        timeout: COMMAND_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024, // 10 MB
      })
    } catch (error: unknown) {
      const err = error as { message?: string; stderr?: string; killed?: boolean }
      const isRetryable =
        err.killed ||
        err.message?.includes('429') ||
        err.stderr?.includes('429') ||
        err.message?.toLowerCase().includes('timeout') ||
        err.message?.toLowerCase().includes('econnreset')

      if (!isRetryable || attempt === MAX_RETRIES) throw error

      const delay = RETRY_BASE_DELAY_MS * 2 ** attempt
      console.warn(
        `[Transcript] Retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`,
      )
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw new Error('[Transcript] Retry loop exited unexpectedly')
}

// ---------------------------------------------------------------------------
// Subtitle parsers
// ---------------------------------------------------------------------------

/**
 * Parse YouTube's JSON3 subtitle format into plain text.
 */
function parseJson3(raw: string): string | null {
  try {
    const data = JSON.parse(raw) as { events?: Json3Event[] }
    if (!data.events) return null

    const segments: string[] = []

    for (const event of data.events) {
      if (!event.segs || event.segs.length === 0) continue

      const text = event.segs
        .map((seg) => seg.utf8 || '')
        .join('')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (text) segments.push(text)
    }

    const fullText = segments.join(' ').replace(/\s+/g, ' ').trim()
    return fullText || null
  } catch {
    return null
  }
}

/**
 * Parse a VTT subtitle file into plain text (strip timestamps + metadata).
 */
function parseVtt(raw: string): string | null {
  const lines = raw.split('\n')
  const textLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    // Skip empty lines, WEBVTT header, timing lines, and NOTE lines
    if (!trimmed) continue
    if (trimmed.startsWith('WEBVTT')) continue
    if (trimmed.startsWith('NOTE')) continue
    if (trimmed.startsWith('Kind:') || trimmed.startsWith('Language:')) continue
    if (/^\d{2}:\d{2}/.test(trimmed) && trimmed.includes('-->')) continue
    // Strip VTT positioning tags like <c> </c> <00:00:01.234>
    const cleaned = trimmed.replace(/<[^>]+>/g, '').trim()
    if (cleaned) textLines.push(cleaned)
  }

  // Deduplicate consecutive identical lines (common in auto-generated subs)
  const deduped: string[] = []
  for (const line of textLines) {
    if (deduped[deduped.length - 1] !== line) {
      deduped.push(line)
    }
  }

  const fullText = deduped.join(' ').replace(/\s+/g, ' ').trim()
  return fullText || null
}
