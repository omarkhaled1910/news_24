import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'

export const Channels: CollectionConfig = {
  slug: 'channels',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'channelId', 'active', 'updatedAt'],
    group: 'أتمتة الأخبار',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      name: 'name',
      label: 'اسم القناة',
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
      name: 'thumbnailUrl',
      label: 'صورة القناة',
      type: 'text',
    },
    {
      name: 'description',
      label: 'وصف القناة',
      type: 'textarea',
    },
    {
      name: 'active',
      label: 'نشطة',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Only active channels will be fetched by the cron job',
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
    },
    {
      name: 'lastFetchedAt',
      label: 'آخر جلب',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'fetchCount',
      label: 'عدد مرات الجلب',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
