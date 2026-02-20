'use client'

import React, { useState } from 'react'
import { X, FileText } from 'lucide-react'

interface TranscriptModalProps {
  transcript: string
  locale: string
  dir: 'rtl' | 'ltr'
}

export function TranscriptModal({ transcript, locale, dir }: TranscriptModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const title = locale === 'ar' ? 'النص الكامل' : 'Full Transcript'
  const buttonLabel = locale === 'ar' ? 'عرض النص الكامل' : 'View Full Transcript'
  const closeLabel = locale === 'ar' ? 'إغلاق' : 'Close'

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors text-sm font-medium"
      >
        <FileText className="w-4 h-4" />
        {buttonLabel}
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div
            className="relative w-full max-w-4xl max-h-[80vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'ar'
                      ? 'النص الأصلي للفيديو الذي تم إنشاء المقال منه'
                      : 'Original transcript of the video source'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                aria-label={closeLabel}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap text-foreground/90 leading-loose">
                  {transcript}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                {closeLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
