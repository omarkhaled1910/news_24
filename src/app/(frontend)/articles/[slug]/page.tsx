import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import Link from 'next/link'
import { ArticleCard } from '@/components/ArticleCard'
import { notFound } from 'next/navigation'
import { getServerI18n } from '@/i18n/server'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const articles = await payload.find({
    collection: 'articles',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  return articles.docs.map(({ slug }) => ({ slug }))
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function ArticlePage({ params: paramsPromise }: Args) {
  await draftMode()
  const { locale, dir, t } = await getServerI18n()
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)

  const article = await queryArticleBySlug({ slug: decodedSlug })

  if (!article) {
    notFound()
  }

  const payload = await getPayload({ config: configPromise })

  // Fetch related articles
  const relatedResult = await payload.find({
    collection: 'articles',
    where: {
      _status: { equals: 'published' },
      id: { not_equals: article.id },
    },
    limit: 4,
    sort: '-publishedAt',
    depth: 2,
  })

  const channel =
    article.channel && typeof article.channel === 'object' ? article.channel : null

  return (
    <article className="min-h-screen pb-16" dir={dir}>
      {/* Article Header */}
      <header className="container mt-8 mb-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-red-600 transition-colors">
            {t('breadcrumb.home')}
          </Link>
          <span>/</span>
          <Link href="/articles" className="hover:text-red-600 transition-colors">
            {t('breadcrumb.articles')}
          </Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{article.title}</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
          {article.title}
        </h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-3xl">
            {article.excerpt}
          </p>
        )}

        {/* Meta bar */}
        <div className="flex flex-wrap items-center gap-4 py-4 border-y border-border text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">
              {article.authorName?.charAt(0) || t('common.brandText').charAt(0)}
            </div>
            <span className="font-semibold text-foreground">{article.authorName}</span>
          </div>
          <span className="text-muted-foreground">|</span>
          <time className="text-muted-foreground">
            {new Date(article.publishedAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>

          {channel && (
            <>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">
                {t('article.source')}: {channel.name}
              </span>
            </>
          )}

          {article.youtubeUrl && (
            <>
              <span className="text-muted-foreground">|</span>
              <a
                href={article.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                {t('article.watchOriginalVideo')} ↗
              </a>
            </>
          )}
        </div>
      </header>

      {/* Hero Image */}
      {article.heroImage && typeof article.heroImage === 'object' && (
        <div className="container mb-8">
          <div className="relative aspect-21/9 rounded-xl overflow-hidden">
            <Media
              resource={article.heroImage as any}
              className="w-full h-full object-cover"
              imgClassName="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Article Content */}
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main content */}
          <div className="lg:col-span-8">
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-p:leading-loose prose-p:text-foreground/90">
              {article.content && <RichText data={article.content} enableGutter={false} />}
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                  {t('article.tags')}:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((t, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-muted text-foreground text-xs rounded-full"
                    >
                      #{t.tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Source attribution */}
            {article.youtubeUrl && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>{t('article.noteLabel')}:</strong> {t('article.generatedFromVideo')}{' '}
                  <strong>{channel?.name || article.authorName}</strong>.{' '}
                  <a
                    href={article.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:underline"
                  >
                    {t('article.watchSourceVideo')}
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Related Articles */}
              {relatedResult.docs.length > 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="bg-foreground px-4 py-3">
                    <h3 className="text-background font-bold text-sm">{t('article.relatedArticles')}</h3>
                  </div>
                  <div className="p-4">
                    {relatedResult.docs.map((relArticle) => (
                      <ArticleCard
                        key={relArticle.id}
                        article={relArticle as any}
                        variant="compact"
                        locale={locale}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { t } = await getServerI18n()
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const article = await queryArticleBySlug({ slug: decodedSlug })

  if (!article) return {}

  return {
    title: `${article.title} | ${t('common.siteName')}`,
    description: article.excerpt || '',
    openGraph: {
      title: article.title,
      description: article.excerpt || '',
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.authorName],
    },
  }
}

const queryArticleBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'articles',
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
