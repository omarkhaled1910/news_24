import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugField } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'categoryId',
  },
  fields: [
    {
      name: 'categoryId',
      type: 'text',
      required: true,
      label: 'Category ID',
      unique: true,
    },
    {
      name: 'categoryEn',
      type: 'text',
      required: true,
      label: 'Category (English)',
    },
    {
      name: 'categoryAr',
      type: 'text',
      required: true,
      label: 'التصنيف (عربي)',
    },
    slugField({
      position: undefined,
    }),
  ],
}
