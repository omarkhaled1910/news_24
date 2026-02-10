import OpenAI from 'openai'

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({ apiKey })
}

export interface GeneratedArticle {
  title: string
  excerpt: string
  content: string // HTML-like structured text that we'll convert to Lexical
  tags: string[]
  category: string
}

/**
 * Generate a professional Arabic news article from a video transcript
 */
export async function generateArticleFromTranscript(
  transcript: string,
  videoTitle: string,
  channelName: string,
  youtubeUrl: string,
): Promise<GeneratedArticle> {
  const openai = getOpenAIClient()

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
  "tags": ["وسم1", "وسم2", "وسم3"],
  "category": "تصنيف مناسب: سياسة أو اقتصاد أو رياضة أو تكنولوجيا أو ثقافة أو مجتمع أو عالم"
}`

  const userPrompt = `حوّل النص التالي من فيديو بعنوان "${videoTitle}" من قناة "${channelName}" إلى مقال إخباري احترافي.

رابط المصدر: ${youtubeUrl}

النص:
${transcript.substring(0, 12000)}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 4000,
  })

  const responseText = response.choices[0]?.message?.content
  if (!responseText) {
    throw new Error('No response from OpenAI')
  }

  const parsed = JSON.parse(responseText)

  // Build content from paragraphs
  const contentParts: string[] = []
  if (parsed.paragraphs && Array.isArray(parsed.paragraphs)) {
    for (const p of parsed.paragraphs) {
      if (p.type === 'heading') {
        contentParts.push(`## ${p.text}`)
      } else {
        contentParts.push(p.text)
      }
    }
  }

  return {
    title: parsed.title || videoTitle,
    excerpt: parsed.excerpt || '',
    content: contentParts.join('\n\n'),
    tags: parsed.tags || [],
    category: parsed.category || 'عام',
  }
}

/**
 * Convert structured text content into Payload's Lexical editor format
 */
export function convertToLexicalJSON(content: string): Record<string, unknown> {
  const lines = content.split('\n\n').filter((line) => line.trim())

  const children: Record<string, unknown>[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('## ')) {
      // Heading
      children.push({
        type: 'heading',
        tag: 'h2',
        children: [
          {
            type: 'text',
            text: trimmed.replace('## ', ''),
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
    } else if (trimmed.startsWith('### ')) {
      children.push({
        type: 'heading',
        tag: 'h3',
        children: [
          {
            type: 'text',
            text: trimmed.replace('### ', ''),
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
      // Paragraph
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
