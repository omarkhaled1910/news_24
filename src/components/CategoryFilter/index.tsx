import React from 'react'
import Link from 'next/link'

export interface Category {
  id: string
  categoryEn: string
  categoryAr: string
  slug?: string | null
}

export interface CategoryFilterProps {
  categories: Category[]
  currentCategory?: string
  locale: string
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  currentCategory,
  locale,
}) => {
  const isRtl = locale === 'ar'

  return (
    <aside className="w-full">
      <div className="bg-card border border-border rounded-xl p-5 sticky top-4">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-red-600 rounded-full" />
          {locale === 'en' ? 'Filter by Category' : 'تصفية حسب التصنيف'}
        </h3>

        <nav aria-label={locale === 'en' ? 'Category filter' : 'فلتر التصنيف'}>
          <ul className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
            {/* All Categories Option */}
            <li>
              <Link
                href="/articles"
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-lg
                  transition-all duration-200
                  ${!currentCategory
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-muted text-foreground hover:bg-muted/80 hover:text-red-600'
                  }
                `}
              >
                <span className="flex-1 font-medium">
                  {locale === 'en' ? 'All Categories' : 'جميع التصنيفات'}
                </span>
                {!currentCategory && (
                  <span className="w-2 h-2 bg-white rounded-full" />
                )}
              </Link>
            </li>

            {/* Category List */}
            {categories.map((category) => {
              const isActive = currentCategory === category.slug
              const categoryName = locale === 'en' ? category.categoryEn : category.categoryAr

              return (
                <li key={category.id}>
                  <Link
                    href={`/articles?category=${category.slug}`}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-lg
                      transition-all duration-200
                      ${isActive
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-muted text-foreground hover:bg-muted/80 hover:text-red-600'
                      }
                    `}
                  >
                    <span className="flex-1 font-medium truncate">
                      {categoryName}
                    </span>
                    {isActive && (
                      <span className="w-2 h-2 bg-white rounded-full shrink-0" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Decorative bottom accent */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {locale === 'en' ? `${categories.length} categories` : `${categories.length} تصنيف`}
            </span>
            <span className="w-16 h-1 bg-gradient-to-r from-red-600 to-transparent rounded-full" />
          </div>
        </div>
      </div>
    </aside>
  )
}
