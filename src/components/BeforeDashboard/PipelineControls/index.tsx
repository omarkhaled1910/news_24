'use client'

import React, { useCallback, useState } from 'react'
import { toast } from '@payloadcms/ui'

import './index.scss'

const baseClass = 'pipeline-controls'

interface PipelineResult {
  success: boolean
  message: string
  deleted?: number
  pipeline?: {
    processed: number
    articles: number
    errors: number
  } | null
}

export const PipelineControls: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null)

  const handleReprocess = useCallback(async () => {
    if (loading) return
    setLoading('reprocess')

    try {
      const res = await fetch('/api/reprocess-videos', {
        method: 'POST',
        credentials: 'include',
      })

      const data: PipelineResult = await res.json()

      if (!res.ok) {
        toast.error('فشل في إعادة المعالجة')
        return
      }

      if (data.deleted === 0) {
        toast.info('لا توجد فيديوهات تحتاج إعادة معالجة')
      } else {
        const msg = data.pipeline
          ? `تم حذف ${data.deleted} فيديو — ${data.pipeline.articles} مقال جديد، ${data.pipeline.errors} أخطاء`
          : `تم حذف ${data.deleted} فيديو وإعادة تشغيل المعالجة`
        toast.success(msg)
      }
    } catch {
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setLoading(null)
    }
  }, [loading])

  const handleRunPipeline = useCallback(async () => {
    if (loading) return
    setLoading('pipeline')

    try {
      const secret = prompt('أدخل CRON_SECRET:')
      if (!secret) {
        setLoading(null)
        return
      }

      const res = await fetch(`/api/cron?secret=${encodeURIComponent(secret)}`)
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'فشل في تشغيل المعالجة')
        return
      }

      toast.success(
        `تمت المعالجة: ${data.processed} فيديو، ${data.articles} مقال، ${data.errors} أخطاء`,
      )
    } catch {
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setLoading(null)
    }
  }, [loading])

  return (
    <div className={baseClass}>
      <h4 className={`${baseClass}__title`}>أتمتة الأخبار</h4>
      <div className={`${baseClass}__buttons`}>
        <button
          className={`${baseClass}__btn ${baseClass}__btn--primary`}
          onClick={handleReprocess}
          disabled={loading !== null}
        >
          {loading === 'reprocess' ? 'جاري إعادة المعالجة...' : 'إعادة معالجة الفيديوهات الفاشلة'}
        </button>
        <button
          className={`${baseClass}__btn ${baseClass}__btn--secondary`}
          onClick={handleRunPipeline}
          disabled={loading !== null}
        >
          {loading === 'pipeline' ? 'جاري التشغيل...' : 'تشغيل المعالجة يدوياً'}
        </button>
      </div>
      <p className={`${baseClass}__hint`}>
        إعادة المعالجة تحذف الفيديوهات التي فشلت في استخراج النص ثم تعيد تشغيل المعالجة التلقائية.
      </p>
    </div>
  )
}
