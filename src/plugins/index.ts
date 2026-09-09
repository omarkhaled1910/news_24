import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { s3Storage } from '@payloadcms/storage-s3'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | أخبار 24` : 'أخبار 24'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  searchPlugin({
    collections: ['posts', 'articles'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  s3Storage({
    enabled: Boolean(process.env.NEXT_PRIVATE_SUPABASE_STORAGE_BUCKET_NAME),
    bucket: process.env.NEXT_PRIVATE_SUPABASE_STORAGE_BUCKET_NAME || '',
    collections: {
      media: {
        disablePayloadAccessControl: true,
        generateFileURL: ({ filename, prefix }) => {
          const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
          if (!base) {
            // Fail loudly instead of silently storing "undefined/storage/..." as the file URL.
            throw new Error(
              'NEXT_PUBLIC_SUPABASE_URL is not set — cannot generate a public Supabase Storage URL for uploaded media.',
            )
          }
          const bucket = process.env.NEXT_PRIVATE_SUPABASE_STORAGE_BUCKET_NAME
          const key = prefix ? `${prefix}/${filename}` : filename
          return `${base}/storage/v1/object/public/${bucket}/${key}`
        },
      },
    },
    config: {
      credentials: {
        accessKeyId: process.env.NEXT_PRIVATE_S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.NEXT_PRIVATE_S3_SECRET_ACCESS_KEY || '',
      },
      region: process.env.NEXT_PRIVATE_S3_REGION || 'us-east-1',
      endpoint: process.env.NEXT_PRIVATE_S3_ENDPOINT,
      forcePathStyle: true,
    },
  }),
]
