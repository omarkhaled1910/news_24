import { SUPABASE_DETECTOR_STRING } from '@/components/Media/ImageMedia'
import { getClientSideURL } from '@/utilities/getURL'

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (
  url: string | null | undefined,
  cacheTag?: string | null,
  isSupabaseUrl?: boolean,
): string => {
  if (!url) return ''

  // Supabase Storage CDN configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET_NAME || 'media'

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  // Transform local /media/ URLs to Supabase CDN URLs if configured
  if (url.startsWith('/media/') && supabaseUrl) {
    const filename = url.split('/').pop()?.split('?')[0] || ''
    const supabaseCdnUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filename}`
    // Don't add cache tag to Supabase URLs
    return supabaseCdnUrl
  }

  // Transform Payload API URLs to direct static URLs or Supabase CDN
  if (url.startsWith('/api/media/file/')) {
    // Extract filename from Payload API URL
    const filename = url.split('/').pop()?.split('?')[0] || ''
    const supabaseCdnUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filename}`
    // Don't add cache tag to Supabase URLs
    return supabaseCdnUrl

    if (supabaseUrl) {
      // Use Supabase CDN if configured
      const supabaseCdnUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filename}`
      // Don't add cache tag to Supabase URLs
      return supabaseCdnUrl
    } else {
      // Otherwise use direct /media/ path
      url = `/media/${filename}`
    }
  }

  // Otherwise prepend client-side URL
  const baseUrl = getClientSideURL()
  return cacheTag ? `${baseUrl}${url}?${cacheTag}` : `${baseUrl}${url}`
}
