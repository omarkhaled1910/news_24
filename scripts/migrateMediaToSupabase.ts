import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import mime from 'mime-types'
import { getPayload } from 'payload'
import config from '@payload-config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY!
const bucketName = process.env.NEXT_PRIVATE_SUPABASE_STORAGE_BUCKET_NAME || 'media'

if (!supabaseUrl || supabaseUrl.includes('your-project')) {
  console.error(
    '❌ Please set NEXT_PUBLIC_SUPABASE_URL in .env before running this script.\n' +
      '   Get your credentials from https://supabase.com/dashboard > Project > Settings > API',
  )
  process.exit(1)
}

if (!supabaseKey || supabaseKey.includes('your_service_role_key')) {
  console.error(
    '❌ Please set SUPABASE_SERVICE_ROLE_KEY in .env before running this script.\n' +
      '   Get your credentials from https://supabase.com/dashboard > Project > Settings > API',
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Generate a UUID v4 (Node.js 20+ has crypto.randomUUID built-in)
 */
function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * Generate a Supabase-safe filename using UUID
 * Keeps the original file extension
 */
function generateSafeFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename)
  const uuid = generateUUID()
  return `${uuid}${ext}`
}

async function migrateMedia() {
  const mediaDir = path.resolve(process.cwd(), 'public/media')

  if (!fs.existsSync(mediaDir)) {
    console.error(`❌ Media directory not found: ${mediaDir}`)
    process.exit(1)
  }

  const files = fs.readdirSync(mediaDir)

  // Filter out subdirectories (like .gitkeep, thumbnail folders, etc.)
  const imageFiles = files.filter((file) => {
    const filePath = path.join(mediaDir, file)
    const stat = fs.statSync(filePath)
    return stat.isFile()
  })

  console.log(`📁 Found ${imageFiles.length} files to migrate...\n`)

  let uploaded = 0
  let failed = 0
  let skipped = 0
  const errors: string[] = []

  // Check if bucket exists and is accessible
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error('❌ Error accessing Supabase Storage:', bucketsError.message)
      console.error(
        '\n💡 Make sure Storage is enabled in your Supabase project:\n' +
          '   https://supabase.com/dashboard > Storage > Create a new bucket named "media"',
      )
      process.exit(1)
    }

    const bucket = buckets?.find((b) => b.name === bucketName)

    if (!bucket) {
      console.error(
        `❌ Bucket "${bucketName}" not found in Supabase Storage.\n` +
          `💡 Please create a bucket named "${bucketName}" at:\n` +
          `   https://supabase.com/dashboard > Storage > Create a new bucket`,
      )
      process.exit(1)
    }

    if (!bucket.public) {
      console.warn(
        `⚠️  Warning: Bucket "${bucketName}" is not public.\n` +
          `   Images may not be accessible via CDN. Make it public in Supabase dashboard.`,
      )
    }
  } catch (err) {
    console.error('❌ Error checking Supabase Storage:', err)
    process.exit(1)
  }

  // Initialize Payload for updating Media records
  console.log('🔌 Connecting to Payload...')
  const payload = await getPayload({ config })

  for (const file of imageFiles) {
    const filePath = path.join(mediaDir, file)
    const stat = fs.statSync(filePath)

    if (stat.isFile()) {
      try {
        const fileBuffer = fs.readFileSync(filePath)
        const contentType = mime.lookup(file) || 'application/octet-stream'

        // Generate a UUID-based filename for Supabase
        const safeFilename = generateSafeFilename(file)
        const supabaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${safeFilename}`

        const { error } = await supabase.storage.from(bucketName).upload(safeFilename, fileBuffer, {
          contentType,
          upsert: true,
        })

        if (error) {
          // If file already exists and content is same, skip
          if (error.message.includes('already exists')) {
            skipped++
            console.log(`⊘ Skipped (exists in Supabase): ${file}`)
            return
          }
          throw error
        }

        // Update the Media record in Payload with the new Supabase URL
        try {
          const { docs: mediaRecords } = await payload.find({
            collection: 'media',
            where: {
              filename: {
                equals: file,
              },
            },
            limit: 1,
          })

          if (mediaRecords.length > 0) {
            const mediaRecord = mediaRecords[0]
            await payload.update({
              collection: 'media',
              id: mediaRecord.id,
              data: {
                url: supabaseUrl,
                filename: safeFilename,
              },
            })
            uploaded++
            console.log(`✓ Uploaded & Updated DB: ${file} → ${safeFilename}`)
          } else {
            // No Media record found, just log it
            uploaded++
            console.log(`✓ Uploaded (no DB record): ${file} → ${safeFilename}`)
          }
        } catch (dbError) {
          // File uploaded but DB update failed
          uploaded++
          console.log(`⚠ Uploaded but DB update failed: ${file} → ${safeFilename}`)
          console.error(`  DB Error: ${dbError}`)
        }
      } catch (err) {
        failed++
        const errorMsg = `✗ Failed: ${file} - ${err}`
        errors.push(errorMsg)
        console.error(errorMsg)
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Migration complete:`)
  console.log(`✓ Uploaded: ${uploaded}`)
  console.log(`⊘ Skipped: ${skipped}`)
  console.log(`✗ Failed: ${failed}`)
  console.log(`${'='.repeat(50)}`)

  if (errors.length > 0) {
    console.log('\n❌ Errors:')
    errors.forEach((e) => console.log(`  ${e}`))
  }

  if (uploaded > 0) {
    console.log(
      `\n✨ Success! ${uploaded} files uploaded to Supabase Storage.\n` +
        `   Bucket: ${bucketName}\n` +
        `   CDN URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/\n` +
        `   \n` +
        `   ✓ Media collection records updated with Supabase URLs\n` +
        `   ✓ Articles will automatically use the new URLs (via relationship IDs)\n` +
        `   \n` +
        `   Images will now be served from Supabase CDN.`,
    )
  }
}

migrateMedia().catch(console.error)
