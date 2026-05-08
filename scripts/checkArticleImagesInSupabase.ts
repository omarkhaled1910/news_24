import 'dotenv/config'

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import mime from 'mime-types'
import path from 'path'
import { getPayload } from 'payload'
import config from '@payload-config'

type Args = {
  fix: boolean
  limit?: number
  onlyMissing: boolean
  verbose: boolean
}

function parseArgs(argv: string[]): Args {
  const fix = argv.includes('--fix')
  const onlyMissing = !argv.includes('--all')
  const verbose = argv.includes('--verbose')

  const limitArg = argv.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined
  return { fix, limit: Number.isFinite(limit) ? limit : undefined, onlyMissing, verbose }
}

const args = parseArgs(process.argv.slice(2))

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PRIVATE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  ''

const supabaseServiceKey =
  process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const defaultBucketName =
  process.env.NEXT_PRIVATE_SUPABASE_STORAGE_BUCKET_NAME ||
  process.env.SUPABASE_STORAGE_BUCKET_NAME ||
  'news_24'

if (!supabaseUrl || supabaseUrl.includes('your-project')) {
  console.error('❌ Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL (or NEXT_PRIVATE_SUPABASE_URL).')
  process.exit(1)
}

if (!supabaseServiceKey || supabaseServiceKey.includes('your_service_role_key')) {
  console.error(
    '❌ Missing Supabase service role key. Set NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY).',
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function parseSupabasePublicUrl(url: string): { bucket: string; key: string } | null {
  // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<key>
  try {
    const u = new URL(url)
    const marker = '/storage/v1/object/public/'
    const idx = u.pathname.indexOf(marker)
    if (idx === -1) return null
    const rest = u.pathname.slice(idx + marker.length) // <bucket>/<key>
    const [bucket, ...keyParts] = rest.split('/').filter(Boolean)
    if (!bucket || keyParts.length === 0) return null
    return { bucket, key: keyParts.join('/') }
  } catch {
    return null
  }
}

function buildSupabasePublicUrl(bucket: string, filename: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`
}

async function urlExists(url: string): Promise<{ ok: boolean; status: number }> {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 15_000)
    const head = await fetch(url, { method: 'HEAD', signal: controller.signal })
    clearTimeout(t)
    if (head.ok) return { ok: true, status: head.status }
    // Some CDNs/buckets may not allow HEAD; fall back to GET.
    if (head.status === 405 || head.status === 400 || head.status === 403) {
      const controller2 = new AbortController()
      const t2 = setTimeout(() => controller2.abort(), 15_000)
      const get = await fetch(url, { method: 'GET', signal: controller2.signal })
      clearTimeout(t2)
      if (get.ok) return { ok: true, status: get.status }

      // Supabase Storage often returns HTTP 400 with a JSON body containing statusCode=404
      // when the object is missing (especially for public bucket URLs).
      if (get.status === 400) {
        try {
          const text = await get.text()
          if (
            text.includes('"statusCode":404') ||
            text.includes('"statusCode":"404"') ||
            text.includes('"error":"not_found"') ||
            text.includes('"message":"Object not found"')
          ) {
            return { ok: false, status: 404 }
          }
        } catch {
          // ignore
        }
      }

      return { ok: false, status: get.status }
    }
    return { ok: false, status: head.status }
  } catch {
    return { ok: false, status: 0 }
  }
}

function getLocalMediaPath(filename: string): string {
  return path.resolve(process.cwd(), 'public', 'media', filename)
}

async function uploadFromLocal(bucket: string, key: string): Promise<boolean> {
  const localPath = getLocalMediaPath(key)
  if (!fs.existsSync(localPath)) return false

  const buffer = fs.readFileSync(localPath)
  const contentType = (mime.lookup(key) || 'application/octet-stream') as string

  const { error } = await supabase.storage.from(bucket).upload(key, buffer, {
    contentType,
    upsert: true,
    cacheControl: '31536000',
  })

  if (error) {
    console.error(`  ✗ Supabase upload failed: ${bucket}/${key}`)
    console.error(`    - ${error.message}`)
    return false
  }

  return true
}

function collectMediaFilenames(mediaDoc: any): string[] {
  const filenames = new Set<string>()
  if (mediaDoc?.filename && typeof mediaDoc.filename === 'string') filenames.add(mediaDoc.filename)

  const sizes = mediaDoc?.sizes
  if (sizes && typeof sizes === 'object') {
    for (const value of Object.values(sizes)) {
      const fn = (value as any)?.filename
      if (fn && typeof fn === 'string') filenames.add(fn)
    }
  }

  return [...filenames].filter(Boolean)
}

async function main(): Promise<void> {
  const payload = await getPayload({ config })

  const missing: Array<{
    articleId: string
    articleTitle: string
    mediaId: string
    bucket: string
    key: string
    url: string
  }> = []

  let page = 1
  const pageSize = 50
  let scanned = 0
  const startedAt = Date.now()

  while (true) {
    const res = await payload.find({
      collection: 'articles',
      depth: 2,
      page,
      limit: pageSize,
      sort: '-updatedAt',
      ...(args.limit ? { pagination: true } : {}),
    } as any)

    const docs = (res as any).docs || []
    if (!docs.length) break

    for (const article of docs) {
      if (args.limit && scanned >= args.limit) break
      scanned++
      if (scanned % 50 === 0) {
        const elapsedS = Math.round((Date.now() - startedAt) / 1000)
        console.log(`…progress: scanned=${scanned} articles (elapsed ${elapsedS}s)`)
      }

      const articleId = String(article.id)
      const articleTitle = String(article.title || '')

      const mediaCandidates: any[] = []
      if (article.heroImage && typeof article.heroImage === 'object') mediaCandidates.push(article.heroImage)
      if (article.meta?.image && typeof article.meta.image === 'object') mediaCandidates.push(article.meta.image)

      for (const media of mediaCandidates) {
        const mediaId = String(media.id || media._id || '')
        const filenames = collectMediaFilenames(media)

        // Determine bucket/keys to check:
        // - If `media.url` is a Supabase public URL, trust its bucket.
        // - Otherwise, assume the default bucket and use filenames as keys.
        const supaParsed = typeof media.url === 'string' ? parseSupabasePublicUrl(media.url) : null
        const bucket = supaParsed?.bucket || defaultBucketName

        const keysToCheck =
          supaParsed?.key && filenames.length === 0 ? [supaParsed.key] : filenames.length ? filenames : []

        if (args.verbose) {
          console.log(
            `checking article="${articleTitle}" media=${mediaId} keys=${keysToCheck.length} bucket=${bucket}`,
          )
        }

        for (const key of keysToCheck) {
          const url = buildSupabasePublicUrl(bucket, key)
          const { ok, status } = await urlExists(url)

          const isMissing = !ok && status === 404
          if (!args.onlyMissing || isMissing) {
            console.log(
              `${ok ? '✓' : '✗'} [${status || 'ERR'}] article="${articleTitle}" media=${mediaId} ${bucket}/${key}`,
            )
          }

          if (isMissing) {
            missing.push({ articleId, articleTitle, mediaId, bucket, key, url })

            if (args.fix) {
              const uploaded = await uploadFromLocal(bucket, key)
              if (uploaded) {
                const after = await urlExists(url)
                console.log(`  ↳ reupload ${uploaded ? 'done' : 'failed'}; now [${after.status || 'ERR'}]`)
              } else {
                console.log(`  ↳ local file not found at ${getLocalMediaPath(key)}`)
              }
            }
          }
        }
      }
    }

    if (args.limit && scanned >= args.limit) break
    page++
    if ((res as any).hasNextPage === false) break
  }

  console.log('\n====================')
  console.log(`Scanned articles: ${scanned}`)
  console.log(`Missing objects (404): ${missing.length}`)
  if (missing.length) {
    console.log('\nMissing list:')
    for (const m of missing) {
      console.log(`- article="${m.articleTitle}" media=${m.mediaId} -> ${m.bucket}/${m.key}`)
      console.log(`  ${m.url}`)
    }
  }

  if (!args.fix && missing.length) {
    console.log('\nRun with --fix to attempt reupload from public/media/:')
    console.log('  pnpm tsx scripts/checkArticleImagesInSupabase.ts --fix')
  }

  // Payload can keep DB handles alive; best-effort cleanup then exit.
  try {
    await (payload as any).close?.()
  } catch {
    // ignore
  }
  try {
    await (payload as any).db?.destroy?.()
  } catch {
    // ignore
  }
  try {
    await (payload as any).db?.close?.()
  } catch {
    // ignore
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

