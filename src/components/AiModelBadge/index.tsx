import React from 'react'
import { getAiModelMeta } from '@/utilities/aiModels'
import { getProviderIcon } from './icons'

interface AiModelBadgeProps {
  aiModel: string
  locale: 'ar' | 'en'
}

/**
 * Prominent "written by AI" pill shown on article pages, colored and iconed
 * per the provider that actually generated the article (see
 * `utilities/aiModels.ts` and `./icons.tsx`).
 */
export function AiModelBadge({ aiModel, locale }: AiModelBadgeProps) {
  const meta = getAiModelMeta(aiModel)
  const Icon = getProviderIcon(meta.provider)
  const label = locale === 'ar' ? 'كُتب بواسطة الذكاء الاصطناعي' : 'Written by AI'

  return (
    <div className="relative inline-flex items-center">
      <span
        aria-hidden
        className={`absolute inset-0 rounded-full bg-gradient-to-r ${meta.gradient} blur-md opacity-40`}
      />
      <div
        className={`relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${meta.gradient} px-4 py-2 shadow-lg ring-1 ring-white/20`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Icon className="h-3.5 w-3.5 text-white" />
        </span>
        <span className="text-xs font-semibold text-white/95 tracking-wide">{label}</span>
        <span className="h-1 w-1 rounded-full bg-white/60" aria-hidden />
        <span className="text-xs font-bold text-white">
          {meta.provider} · {meta.shortName}
        </span>
      </div>
    </div>
  )
}
