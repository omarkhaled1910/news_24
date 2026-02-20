'use client'
import { cn } from '@/utilities/ui'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

// Get the correct icon based on RTL/LTR direction
const getPrevIcon = (isRtl: boolean) => isRtl ? ChevronRight : ChevronLeft
const getNextIcon = (isRtl: boolean) => isRtl ? ChevronLeft : ChevronRight

interface PaginationProps {
  className?: string
  currentPage: number
  totalPages: number
  baseUrl: string
  searchParams?: Record<string, string>
  locale?: string
  translations?: {
    previous?: string
    next?: string
  }
}

/**
 * Generates the page range to display with ellipsis
 * Shows up to 6 page numbers with ellipsis for gaps
 */
function generatePageRange(current: number, total: number): (number | 'ellipsis')[] {
  // If 6 or fewer pages, show all
  if (total <= 6) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = []

  // Always include first page
  pages.push(1)

  // Calculate range around current page
  let start = Math.max(2, current - 2)
  let end = Math.min(total - 1, current + 2)

  // Adjust to always show 4 middle pages if possible
  if (current <= 3) {
    end = Math.min(total - 1, 5)
  } else if (current >= total - 2) {
    start = Math.max(2, total - 4)
  }

  // Add ellipsis before range if needed
  if (start > 2) {
    pages.push('ellipsis')
  }

  // Add middle range
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  // Add ellipsis after range if needed
  if (end < total - 1) {
    pages.push('ellipsis')
  }

  // Always include last page
  if (total > 1) {
    pages.push(total)
  }

  return pages
}

const PaginationButton = ({
  href,
  isActive,
  isDisabled,
  children,
  className,
}: {
  href?: string
  isActive?: boolean
  isDisabled?: boolean
  children: React.ReactNode
  className?: string
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 disabled:pointer-events-none disabled:opacity-50'
  const activeClasses = isActive
    ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
    : 'bg-card border border-border hover:bg-muted'

  if (isDisabled || !href) {
    return (
      <span className={cn(baseClasses, activeClasses, className)}>
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(baseClasses, activeClasses, className)}
    >
      {children}
    </Link>
  )
}

const PaginationEllipsis = () => (
  <span className="inline-flex h-10 w-10 items-center justify-center">
    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
    <span className="sr-only">More pages</span>
  </span>
)

export const Pagination: React.FC<PaginationProps> = (props) => {
  const { className, currentPage, totalPages, baseUrl, searchParams, locale, translations } = props

  const hasPrevPage = currentPage > 1
  const hasNextPage = currentPage < totalPages

  const isRtl = locale === 'ar'

  // Default translations based on locale
  const prevText = translations?.previous || (isRtl ? 'السابق' : 'Previous')
  const nextText = translations?.next || (isRtl ? 'التالي' : 'Next')

  // Get correct icons for RTL/LTR
  const PrevIcon = getPrevIcon(isRtl)
  const NextIcon = getNextIcon(isRtl)

  // Build query string for links
  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams || {})
    params.set('page', String(page))
    const queryString = params.toString()
    return `${baseUrl}?${queryString}`
  }

  const pageRange = generatePageRange(currentPage, totalPages)

  return (
    <nav className={cn('my-12', className)} aria-label="pagination">
      <ul className="flex flex-row items-center justify-center gap-1">
        {/* Previous */}
        <li>
          <PaginationButton
            href={hasPrevPage ? buildUrl(currentPage - 1) : undefined}
            isDisabled={!hasPrevPage}
          >
            <PrevIcon className="h-4 w-4" />
            <span>{prevText}</span>
          </PaginationButton>
        </li>

        {/* Page Numbers */}
        {pageRange.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <li key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </li>
            )
          }

          return (
            <li key={page}>
              <PaginationButton
                href={buildUrl(page)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationButton>
            </li>
          )
        })}

        {/* Next */}
        <li>
          <PaginationButton
            href={hasNextPage ? buildUrl(currentPage + 1) : undefined}
            isDisabled={!hasNextPage}
          >
            <span>{nextText}</span>
            <NextIcon className="h-4 w-4" />
          </PaginationButton>
        </li>
      </ul>
    </nav>
  )
}
