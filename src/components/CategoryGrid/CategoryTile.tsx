import React from 'react'
import Link from 'next/link'

export type TileSize = 'large' | 'medium' | 'small'
export type PatternType = 'dots' | 'lines' | 'waves' | 'none'
export type ColorVariant = 0 | 1 | 2 | 3 | 4

export interface CategoryTileProps {
  category: {
    id: string
    categoryEn: string
    categoryAr: string
    slug?: string | null
  }
  size: TileSize
  variant: ColorVariant
  pattern: PatternType
  locale: string
  index: number
}

const colorVariants: Record<ColorVariant, { from: string; to: string; solid: string }> = {
  0: { from: '#dc2626', to: '#991b1b', solid: '#b91c1c' },
  1: { from: '#ef4444', to: '#b91c1c', solid: '#dc2626' },
  2: { from: '#f87171', to: '#dc2626', solid: '#ef4444' },
  3: { from: '#7f1d1d', to: '#450a0a', solid: '#7f1d1d' },
  4: { from: '#fca5a5', to: '#ef4444', solid: '#f87171' },
}

const patternStyles: Record<PatternType, string> = {
  dots: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
  lines: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)',
  waves: 'radial-gradient(ellipse at top, rgba(255,255,255,0.15) 0%, transparent 50%)',
  none: 'none',
}

const getGridClasses = (size: TileSize): string => {
  switch (size) {
    case 'large':
      return 'col-span-2 row-span-2'
    case 'medium':
      return 'col-span-1 row-span-2'
    case 'small':
      return 'col-span-1 row-span-1'
    default:
      return 'col-span-1 row-span-1'
  }
}

const getInitialLetter = (name: string): string => {
  return name.charAt(0).toUpperCase()
}

export const CategoryTile: React.FC<CategoryTileProps> = ({
  category,
  size,
  variant,
  pattern,
  locale,
  index,
}) => {
  const colors = colorVariants[variant]
  const categoryName = locale === 'en' ? category.categoryEn : category.categoryAr
  const initialLetter = getInitialLetter(categoryName)
  const isRtl = locale === 'ar'

  const gradientStyle = {
    background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
  }

  const patternStyle = pattern !== 'none' ? {
    backgroundImage: patternStyles[pattern],
    backgroundSize: pattern === 'dots' ? '20px 20px' : undefined,
  } : {}

  const combinedStyle = {
    ...gradientStyle,
    ...(pattern !== 'none' ? patternStyle : {}),
  }

  return (
    <Link
      href={`/articles?category=${category.slug}`}
      className={`
        ${getGridClasses(size)}
        relative overflow-hidden rounded-xl
        transition-all duration-300
        hover:scale-[1.03] hover:shadow-xl hover:z-10
        cursor-pointer group
        flex flex-col justify-end
      `}
      style={combinedStyle}
      aria-label={`Browse ${categoryName} articles`}
    >
      {/* Initial Letter Background */}
      <span
        className={`
          absolute -bottom-2 -right-2 text-[6rem] sm:text-[8rem]
          font-black text-white/10 leading-none
          select-none pointer-events-none
          transition-transform duration-500
          group-hover:scale-110 group-hover:rotate-3
          ${isRtl ? '-left-2 right-auto' : ''}
        `}
      >
        {initialLetter}
      </span>

      {/* Pattern Overlay */}
      {pattern !== 'none' && (
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: patternStyles[pattern],
            backgroundSize: pattern === 'dots' ? '20px 20px' : undefined,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 p-3 sm:p-4">
        <h3 className="text-white font-bold text-base sm:text-lg lg:text-xl drop-shadow-lg line-clamp-2">
          {categoryName}
        </h3>
        {size === 'large' && (
          <span className="inline-block mt-2 text-white/80 text-sm">
            {locale === 'en' ? 'Explore →' : 'استكشف ←'}
          </span>
        )}
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </Link>
  )
}
