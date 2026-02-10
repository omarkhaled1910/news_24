import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'

export const Videos: CollectionConfig = {
  slug: 'videos',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'publishedAt'],
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
      name: 'title',
      label: 'عنوان الفيديو',
      type: 'text',
      required: true,
    },
    {
      name: 'videoId',
      label: 'معرف الفيديو (YouTube Video ID)',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'youtubeUrl',
      label: 'رابط الفيديو',
      type: 'text',
      required: true,
    },
    {
      name: 'author',
      label: 'الكاتب',
      type: 'relationship',
      relationTo: 'authors',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      label: 'وصف الفيديو',
      type: 'textarea',
    },
    {
      name: 'thumbnailUrl',
      label: 'صورة مصغرة',
      type: 'text',
    },
    {
      name: 'duration',
      label: 'المدة',
      type: 'text',
    },
    {
      name: 'transcript',
      label: 'النص المكتوب',
      type: 'textarea',
      admin: {
        description: 'Extracted transcript from the video',
      },
    },
    {
      name: 'transcriptLanguage',
      label: 'لغة النص',
      type: 'text',
      defaultValue: 'ar',
    },
    {
      name: 'status',
      label: 'الحالة',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'في الانتظار', value: 'pending' },
        { label: 'تم الجلب', value: 'fetched' },
        { label: 'تم النسخ', value: 'transcribed' },
        { label: 'تم إنشاء المقال', value: 'article_generated' },
        { label: 'فشل', value: 'failed' },
        { label: 'لا يوجد نص', value: 'no_transcript' },
      ],
      index: true,
    },
    {
      name: 'errorMessage',
      label: 'رسالة الخطأ',
      type: 'text',
      admin: {
        readOnly: true,
        condition: (data) => data?.status === 'failed',
      },
    },
    {
      name: 'publishedAt',
      label: 'تاريخ النشر',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'viewCount',
      label: 'عدد المشاهدات',
      type: 'number',
    },
  ],
  timestamps: true,
}
