/**
 * Single source of truth for the AI models the news pipeline can write
 * articles with. Used by the Authors collection (which model to use for that
 * author), the Articles collection (which model actually wrote a given
 * article), `utilities/openai.ts` (routing the actual API request), and the
 * frontend "written by AI" badge on the article page.
 */

/**
 * Sentinel value meaning "use the direct OpenAI API" (the original,
 * unchanged behavior) rather than routing through OpenRouter. Any other
 * value is an OpenRouter model slug (e.g. "anthropic/claude-3.5-sonnet").
 */
export const AI_MODEL_OPENAI_DIRECT = 'openai-direct'

export interface AiModelOption {
  /** Arabic label shown in the Payload admin dropdowns. */
  label: string
  /** Stored value / API model id (or the `AI_MODEL_OPENAI_DIRECT` sentinel). */
  value: string
  /** Provider display name for the frontend badge, e.g. "OpenAI", "Anthropic". */
  provider: string
  /** Model display name for the frontend badge, e.g. "GPT-4o mini". */
  shortName: string
  /** Tailwind gradient stop classes for the frontend badge, e.g. "from-emerald-500 to-teal-500". */
  gradient: string
}

export const AI_MODELS: AiModelOption[] = [
  {
    label: 'OpenAI مباشر - GPT-4o mini (الافتراضي)',
    value: AI_MODEL_OPENAI_DIRECT,
    provider: 'OpenAI',
    shortName: 'GPT-4o mini',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    label: 'OpenRouter: GPT-4o',
    value: 'openai/gpt-4o',
    provider: 'OpenAI',
    shortName: 'GPT-4o',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    label: 'OpenRouter: Claude 3.5 Sonnet',
    value: 'anthropic/claude-3.5-sonnet',
    provider: 'Anthropic',
    shortName: 'Claude 3.5 Sonnet',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    label: 'OpenRouter: Claude 3.7 Sonnet',
    value: 'anthropic/claude-3.7-sonnet',
    provider: 'Anthropic',
    shortName: 'Claude 3.7 Sonnet',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    label: 'OpenRouter: Gemini 2.0 Flash',
    value: 'google/gemini-2.0-flash-001',
    provider: 'Google',
    shortName: 'Gemini 2.0 Flash',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    label: 'OpenRouter: Gemini Pro 1.5',
    value: 'google/gemini-pro-1.5',
    provider: 'Google',
    shortName: 'Gemini Pro 1.5',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    label: 'OpenRouter: Llama 3.3 70B',
    value: 'meta-llama/llama-3.3-70b-instruct',
    provider: 'Meta',
    shortName: 'Llama 3.3 70B',
    gradient: 'from-blue-600 to-cyan-500',
  },
  {
    label: 'OpenRouter: DeepSeek Chat',
    value: 'deepseek/deepseek-chat',
    provider: 'DeepSeek',
    shortName: 'DeepSeek Chat',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    label: 'OpenRouter: DeepSeek R1',
    value: 'deepseek/deepseek-r1',
    provider: 'DeepSeek',
    shortName: 'DeepSeek R1',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    label: 'OpenRouter: Mistral Large',
    value: 'mistralai/mistral-large',
    provider: 'Mistral',
    shortName: 'Mistral Large',
    gradient: 'from-orange-600 to-red-500',
  },
  {
    label: 'OpenRouter: Qwen 2.5 72B',
    value: 'qwen/qwen-2.5-72b-instruct',
    provider: 'Qwen',
    shortName: 'Qwen 2.5 72B',
    gradient: 'from-pink-500 to-rose-500',
  },
]

/** Look up display metadata for a stored `aiModel` value, with a safe fallback. */
export function getAiModelMeta(value: string | null | undefined): AiModelOption {
  const found = AI_MODELS.find((m) => m.value === value)
  if (found) return found
  return AI_MODELS.find((m) => m.value === AI_MODEL_OPENAI_DIRECT) as AiModelOption
}
