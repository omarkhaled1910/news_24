import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'
import { revalidateAuthor, revalidateDelete } from './Authors/hooks/revalidateAuthor'
import { slugField } from 'payload'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'channelId', 'active', 'subscriberCount', 'updatedAt'],
    group: 'المحتوى',
    preview: (doc) => {
      return `${process.env.NEXT_PUBLIC_SERVER_URL}/authors/${doc.slug}`
    },
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'المعلومات الأساسية',
          fields: [
            {
              name: 'name',
              label: 'اسم الكاتب',
              type: 'text',
              required: true,
            },
            {
              name: 'channelId',
              label: 'معرف القناة (YouTube Channel ID)',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              admin: {
                description: 'The YouTube channel ID (e.g., UCxxxxxxx)',
              },
            },
            {
              name: 'channelUrl',
              label: 'رابط القناة',
              type: 'text',
              admin: {
                description: 'Full YouTube channel URL',
              },
            },
            {
              name: 'handle',
              label: 'اسم المستخدم (@handle)',
              type: 'text',
              admin: {
                description: 'YouTube channel handle (e.g., @channelname)',
              },
            },
          ],
        },
        {
          label: 'الملف الشخصي',
          fields: [
            {
              name: 'thumbnailUrl',
              label: 'رابط الصورة المصغرة',
              type: 'text',
              admin: {
                description: 'YouTube channel thumbnail URL (stored for reference)',
              },
            },
            {
              name: 'photo',
              label: 'صورة الكاتب',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Uploaded photo displayed on author pages',
              },
            },
            {
              name: 'bio',
              label: 'السيرة الذاتية',
              type: 'textarea',
              admin: {
                description: 'Author biography for display on website',
              },
            },
            {
              name: 'description',
              label: 'وصف القناة',
              type: 'textarea',
              admin: {
                description: 'YouTube channel description',
              },
            },
          ],
        },
        {
          label: 'بيانات يوتيوب',
          fields: [
            {
              name: 'subscriberCount',
              label: 'عدد المشتركين',
              type: 'number',
              admin: {
                description: 'Channel subscriber count',
              },
            },
            {
              name: 'videoCount',
              label: 'عدد الفيديوهات',
              type: 'number',
              admin: {
                description: 'Total videos on channel',
              },
            },
            {
              name: 'viewCount',
              label: 'إجمالي المشاهدات',
              type: 'number',
              admin: {
                description: 'Total channel views',
              },
            },
            {
              name: 'country',
              label: 'الدولة',
              type: 'text',
            },
            {
              name: 'joinedDate',
              label: 'تاريخ الانضمام',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'day',
                },
              },
            },
            {
              name: 'keywords',
              label: 'الكلمات المفتاحية',
              type: 'array',
              fields: [
                {
                  name: 'keyword',
                  label: 'كلمة مفتاحية',
                  type: 'text',
                },
              ],
            },
            {
              name: 'bannerUrl',
              label: 'رابط البانر',
              type: 'text',
              admin: {
                description: 'Channel banner URL',
              },
            },
          ],
        },
        {
          label: 'روابط التواصل',
          fields: [
            {
              name: 'websiteUrl',
              label: 'الموقع الإلكتروني',
              type: 'text',
              admin: {
                description: 'External website URL',
              },
            },
            {
              name: 'twitterHandle',
              label: 'تويتر (X)',
              type: 'text',
              admin: {
                description: 'Twitter/X username (without @)',
              },
            },
            {
              name: 'instagramHandle',
              label: 'إنستغرام',
              type: 'text',
              admin: {
                description: 'Instagram username (without @)',
              },
            },
            {
              name: 'facebookUrl',
              label: 'فيسبوك',
              type: 'text',
              admin: {
                description: 'Facebook page URL',
              },
            },
          ],
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'active',
      label: 'نشط',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Only active authors will be shown on the website',
      },
    },
    {
      name: 'featured',
      label: 'مميز',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show in featured authors section',
      },
    },
    {
      name: 'language',
      label: 'اللغة',
      type: 'select',
      defaultValue: 'ar',
      options: [
        { label: 'العربية', value: 'ar' },
        { label: 'English', value: 'en' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidateAuthor],
    afterDelete: [revalidateDelete],
  },
  timestamps: true,
}
