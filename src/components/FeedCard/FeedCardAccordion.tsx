'use client'

import * as React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ArticlePreview } from './ArticlePreview'
import type { Locale } from '@/i18n/translations'

interface FeedCardAccordionProps {
  articleId: string
  excerpt?: string | null
  content?: any
  slug?: string | null
  locale?: Locale
}

export const FeedCardAccordion: React.FC<FeedCardAccordionProps> = ({
  articleId,
  excerpt,
  content,
  slug,
  locale = 'ar',
}) => {
  const triggerText = locale === 'ar' ? 'معاينة المقال' : 'Preview Article'

  return (
    <div className="border-t border-border">
      <Accordion type="single" collapsible>
        <AccordionItem value={`preview-${articleId}`} className="border-none">
          <AccordionTrigger className="py-3 px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:no-underline">
            {triggerText}
          </AccordionTrigger>
          <AccordionContent className="pb-4 px-4 pt-0">
            <ArticlePreview excerpt={excerpt} content={content} slug={slug} locale={locale} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
