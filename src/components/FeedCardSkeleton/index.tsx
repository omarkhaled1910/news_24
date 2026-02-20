'use client'

export const FeedCardSkeleton: React.FC = () => {
  return (
    <article className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Image Skeleton */}
      <div className="aspect-16/10 bg-muted animate-pulse" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        </div>

        {/* Meta Row Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-3 bg-muted rounded animate-pulse w-24" />
          <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
        </div>
      </div>

      {/* Accordion Skeleton */}
      <div className="border-t border-border">
        <div className="py-3 px-4">
          <div className="h-4 bg-muted rounded animate-pulse w-32" />
        </div>
      </div>
    </article>
  )
}
