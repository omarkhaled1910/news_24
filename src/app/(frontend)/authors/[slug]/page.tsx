import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Media } from '@/components/Media'
import { ArticleCard } from '@/components/ArticleCard'
import { AuthorCard } from '@/components/AuthorCard'
import { formatSubscriberCount, formatViewCount } from '@/utilities/authorMetadata'
import { getServerI18n } from '@/i18n/server'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const authors = await payload.find({
    collection: 'authors',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    where: {
      active: {
        equals: true,
      },
    },
    select: {
      slug: true,
    },
  })

  return authors.docs.map(({ slug }) => ({ slug }))
}

type Args = {
  params: Promise<{
    slug?: string
  }>
  searchParams: Promise<{ tab?: string }>
}

const queryAuthorBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'authors',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 2,
  })

  return result.docs?.[0] || null
})

const queryAuthorArticles = cache(async (authorId: string | number, page: number = 1) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'articles',
    where: {
      and: [
        {
          author: {
            equals: authorId,
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
      ],
    },
    limit: 12,
    page,
    sort: '-publishedAt',
    depth: 2,
  })

  return result
})

const queryAuthorVideos = cache(async (authorId: string | number, page: number = 1) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'videos',
    where: {
      author: {
        equals: authorId,
      },
    },
    limit: 12,
    page,
    sort: '-publishedAt',
    depth: 1,
  })

  return result
})

export default async function AuthorPage({ params: paramsPromise, searchParams }: Args) {
  await draftMode()
  const { locale, dir, t } = await getServerI18n()
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const params = await searchParams
  const activeTab = params.tab || 'articles'

  const author = await queryAuthorBySlug({ slug: decodedSlug })

  if (!author) {
    notFound()
  }

  const [articlesResult, videosResult] = await Promise.all([
    queryAuthorArticles(author.id, 1),
    queryAuthorVideos(author.id, 1),
  ])

  const photo = author.photo && typeof author.photo === 'object' ? author.photo : null
  const thumbnailUrl = author.thumbnailUrl || ''
  // Format numbers for display
  const subscriberCount = author.subscriberCount && formatSubscriberCount(author.subscriberCount)
  const videoCount = author.videoCount
  const viewCount = author.viewCount && formatViewCount(author.viewCount)

  // Format joined date
  const joinedDate = author.joinedDate
    ? new Date(author.joinedDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
      })
    : null

  return (
    <div className="min-h-screen pb-16" dir={dir}>
      {/* Breadcrumb */}
      <nav className="container flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Link href="/" className="hover:text-red-600 transition-colors">
          {t('breadcrumb.home')}
        </Link>
        <span>/</span>
        <Link href="/authors" className="hover:text-red-600 transition-colors">
          {t('nav.authors')}
        </Link>
        <span>/</span>
        <span className="text-foreground">{author.name}</span>
      </nav>

      {/* Author Profile Header */}
      <header className="container mb-8">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Banner */}
          {author.bannerUrl && (
            <div className="h-48 lg:h-64 bg-gradient-to-r from-red-600/20 to-orange-600/20 relative">
              <img src={author.bannerUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-6 lg:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Photo */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-2xl overflow-hidden bg-muted border-4 border-card -mt-16 md:-mt-20 shadow-lg">
                  {photo?.url ? (
                    <img src={photo.url} alt={author.name} className="w-full h-full object-cover" />
                  ) : thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={author.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-600/20 to-orange-600/20 flex items-center justify-center">
                      <span className="text-5xl font-bold text-red-600">
                        {author.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl lg:text-4xl font-bold text-foreground mb-1">
                      {author.name}
                    </h1>
                    {author.handle && <p className="text-muted-foreground">{author.handle}</p>}
                  </div>

                  {/* Subscribe Button */}
                  {author.channelUrl && (
                    <a
                      href={author.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      {locale === 'ar' ? 'اشترك بالقناة' : 'Subscribe'}
                    </a>
                  )}
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  {subscriberCount && (
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      {subscriberCount} {locale === 'ar' ? 'مشترك' : 'subscribers'}
                    </span>
                  )}
                  {videoCount !== null && videoCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      {videoCount} {locale === 'ar' ? 'فيديو' : 'videos'}
                    </span>
                  )}
                  {viewCount && (
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      {viewCount} {locale === 'ar' ? 'مشاهدة' : 'views'}
                    </span>
                  )}
                  {joinedDate && (
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {locale === 'ar' ? 'انضم في' : 'Joined'} {joinedDate}
                    </span>
                  )}
                  {author.country && (
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {author.country}
                    </span>
                  )}
                  {author.language && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-muted text-foreground text-xs rounded-full">
                      {author.language === 'ar' ? '🇸🇦 العربية' : '🇺🇸 English'}
                    </span>
                  )}
                </div>

                {/* Bio */}
                {(author.bio || author.description) && (
                  <p className="text-muted-foreground leading-relaxed">
                    {author.bio || author.description}
                  </p>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-border">
              {author.websiteUrl && (
                <a
                  href={author.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  {locale === 'ar' ? 'الموقع الإلكتروني' : 'Website'}
                </a>
              )}
              {author.twitterHandle && (
                <a
                  href={`https://twitter.com/${author.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitter/X
                </a>
              )}
              {author.instagramHandle && (
                <a
                  href={`https://instagram.com/${author.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  Instagram
                </a>
              )}
              {author.facebookUrl && (
                <a
                  href={author.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mb-6">
        <div className="flex gap-4 border-b border-border">
          <Link
            href={`/authors/${author.slug}`}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'articles'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {locale === 'ar' ? 'المقالات' : 'Articles'}
            {articlesResult.totalDocs > 0 && (
              <span className="mr-2 text-sm text-muted-foreground">
                ({articlesResult.totalDocs})
              </span>
            )}
          </Link>
          <Link
            href={`/authors/${author.slug}?tab=videos`}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'videos'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {locale === 'ar' ? 'الفيديوهات' : 'Videos'}
            {videosResult.totalDocs > 0 && (
              <span className="mr-2 text-sm text-muted-foreground">({videosResult.totalDocs})</span>
            )}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {activeTab === 'articles' ? (
              articlesResult.docs.length > 0 ? (
                <div className="space-y-6">
                  {articlesResult.docs.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article as any}
                      variant="horizontal"
                      locale={locale}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                  <p className="text-muted-foreground">
                    {locale === 'ar' ? 'لا توجد مقالات لهذا الكاتب' : 'No articles by this author'}
                  </p>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videosResult.docs.length > 0 ? (
                  videosResult.docs.map((video) => (
                    <a
                      key={video.id}
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-card rounded-xl overflow-hidden border border-border hover:border-red-600/50 transition-all"
                    >
                      <div className="aspect-video relative bg-muted">
                        {video.thumbnailUrl && (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white ml-1"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-red-600 transition-colors">
                          {video.title}
                        </h3>
                        {video.publishedAt && (
                          <span className="text-sm text-muted-foreground">
                            {new Date(video.publishedAt).toLocaleDateString(
                              locale === 'ar' ? 'ar-SA' : 'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              },
                            )}
                          </span>
                        )}
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 bg-card rounded-xl border border-border">
                    <p className="text-muted-foreground">
                      {locale === 'ar'
                        ? 'لا توجد فيديوهات لهذا الكاتب'
                        : 'No videos by this author'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Author Stats Card */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="bg-foreground px-4 py-3">
                  <h3 className="text-background font-bold text-sm">
                    {locale === 'ar' ? 'إحصائيات' : 'Statistics'}
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      {locale === 'ar' ? 'المقالات' : 'Articles'}
                    </span>
                    <span className="font-semibold">{articlesResult.totalDocs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      {locale === 'ar' ? 'الفيديوهات' : 'Videos'}
                    </span>
                    <span className="font-semibold">{videosResult.totalDocs}</span>
                  </div>
                  {subscriberCount && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">
                        {locale === 'ar' ? 'المشتركون' : 'Subscribers'}
                      </span>
                      <span className="font-semibold">{subscriberCount}</span>
                    </div>
                  )}
                  {author.createdAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">
                        {locale === 'ar' ? 'تاريخ الإضافة' : 'Added'}
                      </span>
                      <span className="font-semibold text-xs">
                        {new Date(author.createdAt).toLocaleDateString(
                          locale === 'ar' ? 'ar-SA' : 'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          },
                        )}
                      </span>
                    </div>
                  )}
                  {author.updatedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">
                        {locale === 'ar' ? 'آخر تحديث' : 'Updated'}
                      </span>
                      <span className="font-semibold text-xs">
                        {new Date(author.updatedAt).toLocaleDateString(
                          locale === 'ar' ? 'ar-SA' : 'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          },
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Keywords */}
              {author.keywords && author.keywords.length > 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="bg-foreground px-4 py-3">
                    <h3 className="text-background font-bold text-sm">
                      {locale === 'ar' ? 'الكلمات المفتاحية' : 'Keywords'}
                    </h3>
                  </div>
                  <div className="p-4 flex flex-wrap gap-2">
                    {author.keywords.map((keyword, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-muted text-foreground text-xs rounded-full"
                      >
                        {keyword.keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { t } = await getServerI18n()
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const author = await queryAuthorBySlug({ slug: decodedSlug })

  if (!author) return {}

  return {
    title: `${author.name} | ${t('common.siteName')}`,
    description: author.bio || author.description || `${author.name} - ${t('nav.authors')}`,
    openGraph: {
      title: author.name,
      description: author.bio || author.description || '',
      type: 'profile',
      images:
        author.photo && typeof author.photo === 'object' && author.photo.url
          ? [{ url: author.photo.url }]
          : author.thumbnailUrl
            ? [{ url: author.thumbnailUrl }]
            : [],
    },
  }
}
