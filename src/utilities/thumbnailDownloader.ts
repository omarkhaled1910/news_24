import type { Payload } from 'payload'
import type { PayloadRequest } from 'payload'

/**
 * Generate a UUID v4 (Node.js 20+ has crypto.randomUUID built-in)
 */
function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * Download a YouTube thumbnail and upload it to Payload's media collection.
 *
 * Uploads the buffer directly through Payload's local API (`file`), which is
 * routed to Supabase Storage by the `s3Storage` plugin — no local disk I/O.
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

    // UUID filename - the S3 storage plugin uses this verbatim as the object
    // key, and Arabic/non-ASCII titles produce keys S3-compatible storage rejects.
    const filename = `${generateUUID()}${ext}`

    const media = await payload.create({
      collection: 'media',
      data: {
        alt: videoTitle,
      },
      file: {
        data: buffer,
        mimetype: contentType,
        name: filename,
        size: buffer.length,
      },
      ...(req ? { req } : {}),
    })

    return media.id as string
  } catch (error) {
    console.error('Error downloading thumbnail:', error)
    return null
  }
}
