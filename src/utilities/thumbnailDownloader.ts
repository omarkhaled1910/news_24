import type { Payload } from 'payload'
import type { PayloadRequest } from 'payload'
import { createClient } from '@supabase/supabase-js'

const defaultSupabaseUrl = 'https://hjcumckocwmrkleqxjrz.supabase.co'
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PRIVATE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  defaultSupabaseUrl
const supabaseKey =
  process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const bucketName =
  process.env.NEXT_PRIVATE_SUPABASE_STORAGE_BUCKET_NAME ||
  process.env.SUPABASE_STORAGE_BUCKET_NAME ||
  'media'

// Initialize Supabase client if credentials are available
const supabase =
  supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')
    ? createClient(supabaseUrl, supabaseKey)
    : null

/**
 * Generate a UUID v4 (Node.js 20+ has crypto.randomUUID built-in)
 */
function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * Download a YouTube thumbnail and upload it to Payload's media collection
 *
 * If Supabase is configured, uploads to Supabase Storage with a UUID filename.
 * Otherwise, falls back to local file storage.
 */
export async function downloadAndUploadThumbnail(
  thumbnailUrl: string,
  videoTitle: string,
  payload: Payload,
  req?: PayloadRequest,
): Promise<string | null> {
  try {
    if (!thumbnailUrl) return null

    // Fetch the image
    const response = await fetch(thumbnailUrl)
    if (!response.ok) {
      console.warn(`Failed to fetch thumbnail: ${response.statusText}`)
      return null
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? '.png' : '.jpg'

    // If Supabase is configured, upload directly to Supabase Storage
    if (supabase) {
      const uuid = generateUUID()
      const filename = `${uuid}${ext}`
      const supabaseUrlPath = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filename}`

      const { data, error } = await supabase.storage.from(bucketName).upload(filename, buffer, {
        contentType,
        upsert: true,
        cacheControl: '31536000', // 1 year cache
      })

      if (error) {
        console.error('Failed to upload to Supabase:', error)
        console.error('  - Bucket:', bucketName)
        console.error('  - Filename:', filename)
        console.error('  - Error message:', error.message)
        console.error('  - Error status:', (error as any).statusCode || 'unknown')
        return null
      }

      console.log('[Thumbnail] Supabase upload successful:', data?.path)

      // Create Media record with Supabase URL
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: videoTitle,
          url: supabaseUrlPath,
          filename: filename,
        },
        ...(req ? { req } : {}),
      })

      console.log(`[Thumbnail] Uploaded to Supabase: ${filename}`)
      return media.id as string
    }

    // Fallback: Local file storage (when Supabase is not configured)
    const path = await import('path')
    const fs = await import('fs')
    const { fileURLToPath } = await import('url')

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    // Create a safe filename (keeping legacy behavior for local storage)
    const safeTitle = videoTitle
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
    const filename = `yt-${safeTitle}-${Date.now()}${ext}`

    // Write to a temporary file
    const tempDir = path.resolve(__dirname, '../../tmp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    const tempPath = path.resolve(tempDir, filename)
    fs.writeFileSync(tempPath, buffer)

    // Upload to Payload media collection
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: videoTitle,
      },
      filePath: tempPath,
      ...(req ? { req } : {}),
    })

    // Clean up temp file
    try {
      fs.unlinkSync(tempPath)
    } catch {
      // Ignore cleanup errors
    }

    return media.id as string
  } catch (error) {
    console.error('Error downloading thumbnail:', error)
    return null
  }
}
