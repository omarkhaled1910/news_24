import { getClientSideURL } from '@/utilities/getURL'

/**
 * Resolves a Payload media URL for the frontend.
 * New uploads use absolute Supabase public URLs; legacy relative paths are prefixed with the site URL.
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  let resolved = url

  if (resolved.startsWith('/api/media/file/')) {
    const filename = resolved.split('/').pop()?.split('?')[0] || ''
    resolved = `/api/media/file/${filename}`
  }

  if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
    return cacheTag ? `${resolved}?${cacheTag}` : resolved
  }

  const baseUrl = getClientSideURL()
  return cacheTag ? `${baseUrl}${resolved}?${cacheTag}` : `${baseUrl}${resolved}`
}
