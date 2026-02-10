import OpenAI from 'openai'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const MAX_TRANSCRIPT_CHARS = 12_000
const MAX_TOKENS = 4_000
const TEMPERATURE = 0.3
const MAX_RETRIES = 3
const RETRY_BASE_DELAY_MS = 1_000

// ---------------------------------------------------------------------------
// OpenAI client (lazy)
// ---------------------------------------------------------------------------
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({ apiKey })
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status
      const isRetryable = typeof status === 'number' && [429, 500, 503].includes(status)
      if (!isRetryable || attempt === maxRetries) throw error
      const delay = RETRY_BASE_DELAY_MS * 2 ** attempt
      console.warn(`[OpenAI] Retry ${attempt + 1}/${maxRetries} after ${delay}ms (status ${status})`)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  // Unreachable – the loop always returns or throws
  throw new Error('[OpenAI] Retry loop exited unexpectedly')
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface GeneratedArticle {
  title: string
  excerpt: string
  content: string // Structured text that we convert to Lexical
  tags: string[]
}

export interface LexicalTextNode {
  type: 'text'
  text: string
  format: number
  detail: number
  mode: string
  style: string
  version: number
}

export interface LexicalBlockNode {
  type: 'heading' | 'paragraph' | 'root'
  tag?: string
  children: (LexicalTextNode | LexicalBlockNode)[]
  direction: string
  format: string | number
  indent: number
  version: number
  textFormat?: number
  textStyle?: string
}

export interface LexicalEditorState {
  root: LexicalBlockNode
}

// ---------------------------------------------------------------------------
// Article generation
// ---------------------------------------------------------------------------

/**
 * Generate a professional Arabic news article from a video transcript.
 */
export async function generateArticleFromTranscript(
  transcript: string,
  videoTitle: string,
  channelName: string,
  youtubeUrl: string,
): Promise<GeneratedArticle> {
  // Input validation
  if (!transcript?.trim()) throw new Error('[OpenAI] Transcript is empty')
  if (!videoTitle?.trim()) throw new Error('[OpenAI] Video title is empty')

  const openai = getOpenAIClient()

  // Warn on truncation
  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    console.warn(
      `[OpenAI] Transcript truncated from ${transcript.length} to ${MAX_TRANSCRIPT_CHARS} chars`,
    )
  }

  const systemPrompt = `أنت صحفي محترف تعمل في وكالة أنباء عربية مرموقة. مهمتك تحويل نصوص الفيديوهات الإخبارية إلى مقالات إخبارية احترافية.

القواعد الصارمة:
1. اكتب بأسلوب إخباري محايد وموضوعي
2. لا تختلق أي معلومات - استخدم فقط ما ورد في النص
3. حافظ على جميع الأسماء والأرقام والاقتباسات بدقة
4. اكتب بالعربية الفصحى الحديثة
5. قسّم المقال إلى فقرات واضحة
6. ابدأ بمقدمة إخبارية قوية تلخص الخبر (من، ماذا، أين، متى)
7. أضف عناوين فرعية للفقرات الرئيسية
8. اختم بخلاصة أو سياق إضافي
9. أشر إلى المصدر

أعد الإجابة بصيغة JSON بالتنسيق التالي:
{
  "title": "عنوان المقال الإخباري",
  "excerpt": "ملخص قصير للمقال في جملتين أو ثلاث",
  "paragraphs": [
    {"type": "paragraph", "text": "نص الفقرة"},
    {"type": "heading", "text": "عنوان فرعي"},
    {"type": "paragraph", "text": "نص الفقرة"}
  ],
  "tags": ["وسم1", "وسم2", "وسم3"]
}`

  const userPrompt = `حوّل النص التالي من فيديو بعنوان "${videoTitle}" من قناة "${channelName}" إلى مقال إخباري احترافي.

رابط المصدر: ${youtubeUrl}

النص:
${transcript.substring(0, MAX_TRANSCRIPT_CHARS)}`

  const response = await callWithRetry(() =>
    openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
    }),
  )

  const responseText = response.choices[0]?.message?.content
  if (!responseText) {
    throw new Error('[OpenAI] No response content from OpenAI')
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(responseText)
  } catch {
    throw new Error(
      `[OpenAI] Failed to parse response as JSON: ${responseText.substring(0, 200)}`,
    )
  }

  // Build content from paragraphs
  const contentParts: string[] = []
  if (parsed.paragraphs && Array.isArray(parsed.paragraphs)) {
    for (const p of parsed.paragraphs as { type?: string; text?: string }[]) {
      if (p.type === 'heading') {
        contentParts.push(`## ${p.text}`)
      } else {
        contentParts.push(p.text ?? '')
      }
    }
  }

  // Fallback logging
  if (!parsed.title) {
    console.warn('[OpenAI] LLM returned empty title, using video title as fallback')
  }
  if (!parsed.excerpt) {
    console.warn('[OpenAI] LLM returned empty excerpt')
  }
  if (!Array.isArray(parsed.tags) || parsed.tags.length === 0) {
    console.warn('[OpenAI] LLM returned empty tags array')
  }

  return {
    title: (parsed.title as string) || videoTitle,
    excerpt: (parsed.excerpt as string) || '',
    content: contentParts.join('\n\n'),
    tags: (parsed.tags as string[]) || [],
  }
}

// ---------------------------------------------------------------------------
// Lexical conversion
// ---------------------------------------------------------------------------

const HEADING_REGEX = /^(#{1,6})\s+(.+)$/

/**
 * Map heading marker length to the appropriate HTML tag.
 */
function headingTag(level: number): string {
  const clamped = Math.min(Math.max(level, 1), 6)
  return `h${clamped}`
}

/**
 * Convert structured text content into Payload's Lexical editor format.
 */
export function convertToLexicalJSON(content: string): LexicalEditorState {
  const lines = content.split('\n\n').filter((line) => line.trim())

  const children: LexicalBlockNode[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    const headingMatch = HEADING_REGEX.exec(trimmed)

    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2]

      children.push({
        type: 'heading',
        tag: headingTag(level),
        children: [
          {
            type: 'text',
            text,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
        direction: 'rtl',
        format: '',
        indent: 0,
        version: 1,
      })
    } else {
      children.push({
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: trimmed,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
        direction: 'rtl',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
      })
    }
  }

  return {
    root: {
      type: 'root',
      children,
      direction: 'rtl',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}
