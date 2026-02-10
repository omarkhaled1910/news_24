'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createTranslator, getDirection, type Locale } from '@/i18n/translations'

interface CarouselArticle {
  id: string | number
  title: string
  slug?: string | null
  excerpt?: string | null
  heroImage?: any
  authorName: string
  publishedAt: string
  categories?: any
  breakingNews?: boolean | null
}

interface ArticleCarouselProps {
  articles: CarouselArticle[]
  locale: Locale
  autoPlayInterval?: number
}

export const ArticleCarousel: React.FC<ArticleCarouselProps> = ({
  articles,
  locale,
  autoPlayInterval = 5000,
}) => {
  const t = createTranslator(locale)
  const dir = getDirection(locale)
  const isRTL = dir === 'rtl'
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const total = articles.length

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setCurrent(((index % total) + total) % total)
      setTimeout(() => setIsTransitioning(false), 500)
    },
    [total, isTransitioning],
  )

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  // Auto-play
  useEffect(() => {
    if (isPaused || total <= 1) return

    timeoutRef.current = setTimeout(next, autoPlayInterval)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [current, isPaused, next, autoPlayInterval, total])

  if (!articles.length) return null

  const article = articles[current]
  const categoryNames = Array.isArray(article?.categories)
    ? article.categories
        .filter((c: any): c is { title: string } => typeof c === 'object')
        .map((c: { title: string }) => c.title)
    : []

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-card border border-border group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      dir={dir}
    >
      {/* Slides */}
      <div className="relative aspect-16/8 sm:aspect-video overflow-hidden">
        {articles.map((slide, index) => {
          const slideCats = Array.isArray(slide.categories)
            ? slide.categories
                .filter((c: any): c is { title: string } => typeof c === 'object')
                .map((c: { title: string }) => c.title)
            : []

          return (
            <Link
              key={slide.id}
              href={`/articles/${slide.slug}`}
              className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                index === current
                  ? 'opacity-100 scale-100 z-10'
                  : 'opacity-0 scale-105 z-0 pointer-events-none'
              }`}
              aria-hidden={index !== current}
              tabIndex={index === current ? 0 : -1}
            >
              {/* Image */}
              {slide.heroImage && typeof slide.heroImage === 'object' ? (
                <Media
                  resource={slide.heroImage as any}
                  className="w-full h-full object-cover"
                  imgClassName="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-bl from-red-900 to-gray-900 flex items-center justify-center">
                  <span className="text-white/20 text-6xl font-bold">
                    {t('common.siteName')}
                  </span>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

              {/* Breaking badge */}
              {slide.breakingNews && (
                <div className="absolute top-4 end-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-md animate-pulse z-20">
                  {t('home.breaking')}
                </div>
              )}

              {/* Category badge */}
              {slideCats.length > 0 && (
                <div className="absolute top-4 start-4 bg-white/15 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-md z-20">
                  {slideCats[0]}
                </div>
              )}

              {/* Content overlay */}
              <div className="absolute bottom-0 start-0 end-0 p-6 lg:p-8 z-20">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mb-2 line-clamp-2">
                  {slide.title}
                </h2>
                {slide.excerpt && (
                  <p className="text-white/75 text-sm lg:text-base line-clamp-2 mb-3 max-w-2xl">
                    {slide.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <span className="font-medium text-white/80">{slide.authorName}</span>
                  <span>{t('common.dotSeparator')}</span>
                  <time>{formatDateTime(slide.publishedAt)}</time>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Navigation Arrows */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault()
              isRTL ? next() : prev()
            }}
            className="absolute start-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60"
            aria-label={t('pagination.previous')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              isRTL ? prev() : next()
            }}
            className="absolute end-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60"
            aria-label={t('pagination.next')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots + Progress */}
      {total > 1 && (
        <div className="absolute bottom-0 start-0 end-0 z-30">
          {/* Progress bar */}
          <div className="h-0.5 bg-white/10 w-full">
            <div
              className="h-full bg-red-500 transition-all duration-300 ease-out"
              style={{ width: `${((current + 1) / total) * 100}%` }}
            />
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 py-3 bg-linear-to-t from-black/40 to-transparent">
            {articles.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault()
                  goTo(index)
                }}
                className={`transition-all duration-300 rounded-full ${
                  index === current
                    ? 'w-6 h-2 bg-red-500'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`${t('common.page')} ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
