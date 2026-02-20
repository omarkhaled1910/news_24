import React from 'react'
import { CategoryTile, type TileSize, type ColorVariant, type PatternType } from './CategoryTile'

export interface Category {
  id: string
  categoryEn: string
  categoryAr: string
  slug?: string | null
}

export interface CategoryGridProps {
  categories: Category[]
  locale: string
}

type TileConfig = {
  size: TileSize
  variant: ColorVariant
  pattern: PatternType
}

const patterns: PatternType[] = ['dots', 'lines', 'waves', 'none', 'dots']

const getTileConfig = (index: number, totalCategories: number): TileConfig => {
  // Determine tile size
  let size: TileSize = 'small'
  if (index < 2 && totalCategories >= 4) {
    size = 'large'
  } else if (index < 5 && totalCategories >= 6) {
    size = 'medium'
  }

  // Cycle through color variants
  const variant: ColorVariant = (index % 5) as ColorVariant

  // Cycle through patterns
  const pattern: PatternType = patterns[index % patterns.length]

  return { size, variant, pattern }
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, locale }) => {
  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <section className="w-full">
      <div className="container">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground border-r-4 border-red-600 pr-4">
            {locale === 'en' ? 'Browse by Category' : 'تصفح حسب التصنيف'}
          </h2>
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[100px] sm:auto-rows-[120px] lg:auto-rows-[140px]">
          {categories.map((category, index) => {
            const config = getTileConfig(index, categories.length)

            return (
              <CategoryTile
                key={category.id}
                category={category}
                size={config.size}
                variant={config.variant}
                pattern={config.pattern}
                locale={locale}
                index={index}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
