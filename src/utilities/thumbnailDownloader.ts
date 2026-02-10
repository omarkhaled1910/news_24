import type { Payload } from 'payload'
import type { PayloadRequest } from 'payload'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Download a YouTube thumbnail and upload it to Payload's media collection
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

    // Create a safe filename
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
