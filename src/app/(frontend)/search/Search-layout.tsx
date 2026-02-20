'use client'

import React, { useState, useEffect } from 'react'
import { SearchFilters, Category } from '@/components/SearchFilters'
import { SearchResults } from '@/components/SearchResults'
import type { Locale } from '@/i18n/translations'

interface SearchLayoutProps {
  query: string
  category?: string
  sort?: string
  locale: Locale
  categories: Category[]
}

export const SearchLayout: React.FC<SearchLayoutProps> = ({
  query,
  category,
  sort,
  locale,
  categories,
}) => {
  const [_isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    // Initial check
    checkMobile()

    // Add event listener for resize
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="container mt-8">
      {/* Mobile: Filters at top (collapsible), then results */}
      <div className="lg:hidden">
        <SearchFilters
          categories={categories}
          currentCategory={category}
          currentSort={sort}
          searchQuery={query}
          isMobile={true}
        />
        <div className="mt-6">
          <SearchResults query={query} category={category} sort={sort} locale={locale} />
        </div>
      </div>

      {/* Desktop: Side-by-side layout with sticky sidebar */}
      <div className="hidden lg:flex gap-8">
        {/* Main content - results */}
        <div className="flex-1 min-w-0">
          <SearchResults query={query} category={category} sort={sort} locale={locale} />
        </div>

        {/* Sidebar - Filters */}
        <aside className="w-72 shrink-0">
          <SearchFilters
            categories={categories}
            currentCategory={category}
            currentSort={sort}
            searchQuery={query}
            isMobile={false}
          />
        </aside>
      </div>
    </div>
  )
}
