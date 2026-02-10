import React from 'react'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { formatSubscriberCount } from '@/utilities/authorMetadata'

export interface Author {
  id: string | number
  name: string
  slug?: string | null
  photo?: any
  thumbnailUrl?: string | null
  bio?: string | null
  subscriberCount?: number | null
  videoCount?: number | null
  viewCount?: number | null
  articleCount?: number | null
  channelUrl?: string | null
}

interface AuthorCardProps {
  author: Author
  variant?: 'default' | 'compact' | 'horizontal'
  locale?: string
}

export function AuthorCard({ author, variant = 'default', locale = 'ar' }: AuthorCardProps) {
  const { name, slug, photo, thumbnailUrl, bio, subscriberCount, videoCount } = author

  if (variant === 'compact') {
    return (
      <Link
        href={`/authors/${slug}`}
        className="flex items-center gap-3 p-3 bg-card hover:bg-muted rounded-lg transition-colors"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
          {photo?.url ? (
            <img
              src={photo.url}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {name?.charAt(0) || '?'}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">{name}</h3>
          {subscriberCount && (
            <p className="text-xs text-muted-foreground">
              {formatSubscriberCount(subscriberCount)} {locale === 'ar' ? 'مشترك' : 'subscribers'}
            </p>
          )}
        </div>
      </Link>
    )
  }

  if (variant === 'horizontal') {
    return (
      <Link
        href={`/authors/${slug}`}
        className="flex items-center gap-4 p-4 bg-card hover:bg-muted rounded-xl border border-border transition-colors"
      >
        <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
          {photo?.url ? (
            <img
              src={photo.url}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {name?.charAt(0) || '?'}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground text-lg truncate">{name}</h3>
          {bio && (
            <p className="text-sm text-muted-foreground line-clamp-1">{bio}</p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {subscriberCount && (
              <span>
                {formatSubscriberCount(subscriberCount)} {locale === 'ar' ? 'مشترك' : 'subscribers'}
              </span>
            )}
            {videoCount && (
              <>
                <span>•</span>
                <span>
                  {videoCount} {locale === 'ar' ? 'فيديو' : 'videos'}
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // Default variant
  return (
    <Link
      href={`/authors/${slug}`}
      className="group bg-card rounded-xl border border-border overflow-hidden hover:border-red-600/50 transition-all duration-300 hover:shadow-lg"
    >
      <div className="aspect-square relative overflow-hidden bg-muted">
        {photo && typeof photo === 'object' && photo.url ? (
          <Media
            resource={photo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-600/20 to-orange-600/20 flex items-center justify-center">
            <span className="text-4xl font-bold text-red-600">
              {name?.charAt(0) || '?'}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-lg mb-1 group-hover:text-red-600 transition-colors">
          {name}
        </h3>
        {bio && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{bio}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
              {formatSubscriberCount(subscriberCount)}
            </span>
          )}
          {videoCount && (
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
        </div>
      </div>
    </Link>
  )
}
