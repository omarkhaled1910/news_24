import React from 'react'

interface IconProps {
  className?: string
}

/** Hexagonal knot motif, evoking OpenAI's interlocking mark. */
export function OpenAIIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  )
}

/** Bold geometric "A" monogram, evoking Anthropic's mark. */
export function AnthropicIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9.5 4h2.2l6.3 16h-2.9l-1.3-3.4H10l-1.3 3.4H5.8L9.5 4Zm1.1 3.9-1.7 5.3h3.4l-1.7-5.3Z" />
    </svg>
  )
}

/** Four-point sparkle, matching Gemini's star mark. */
export function GeminiIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2c.35 4 1.2 6.85 3 8.65S19 12.65 22 13c-3 .35-5.2 1.2-7 3S12.35 20 12 22c-.35-4-1.2-6.85-3-8.65S5 13 2 13c3-.35 5.2-1.2 7-3s2.65-3 3-7Z" />
    </svg>
  )
}

/** Infinity loop, matching Meta's mark. */
export function MetaIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 8c-2.5 0-4.3 1.9-4.3 4s1.8 4 4.3 4c1.8 0 3-1 4-2.7.7-1.1 1.3-2.6 2-3.6 1-1.7 2.2-2.7 4-2.7 2.5 0 4.3 1.9 4.3 4s-1.8 4-4.3 4c-1.8 0-3-1-4-2.7-.7-1.1-1.3-2.6-2-3.6-1-1.7-2.2-2.7-4-2.7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Simplified whale silhouette, matching DeepSeek's mark. */
export function DeepSeekIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M2.5 13.2c1.8-4 5.9-6.4 9.9-6.4 3.2 0 5.9 1.4 7.5 3.6.7-.5 1.5-.9 2.2-.9-.2 1-.7 1.9-1.4 2.5 1 .5 1.9 1.4 2.3 2.4-1.3.4-2.6.2-3.6-.4-1.9 2-4.9 3.3-8.5 3.3-3.8 0-7-1.7-8.4-4.1Z" />
      <circle cx="9" cy="12" r="0.9" fill="white" fillOpacity="0.9" />
    </svg>
  )
}

/** Offset horizontal bars, evoking Mistral's mark. */
export function MistralIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="3" y="5" width="18" height="3.2" rx="0.5" />
      <rect x="3" y="10.4" width="12" height="3.2" rx="0.5" />
      <rect x="3" y="15.8" width="18" height="3.2" rx="0.5" />
    </svg>
  )
}

/** Orbit ring, evoking Qwen's mark. */
export function QwenIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="4.5" r="1.8" fill="currentColor" />
    </svg>
  )
}

/** Generic fallback sparkle for any provider without a dedicated icon. */
export function SparkleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5c.3 0 .58.2.67.48l1.6 4.6 4.6 1.6a.71.71 0 0 1 0 1.34l-4.6 1.6-1.6 4.6a.71.71 0 0 1-1.34 0l-1.6-4.6-4.6-1.6a.71.71 0 0 1 0-1.34l4.6-1.6 1.6-4.6c.09-.28.37-.48.67-.48Z" />
      <path d="M19 15c.22 0 .42.14.48.35l.5 1.6 1.6.5a.5.5 0 0 1 0 .96l-1.6.5-.5 1.6a.5.5 0 0 1-.96 0l-.5-1.6-1.6-.5a.5.5 0 0 1 0-.96l1.6-.5.5-1.6c.06-.21.26-.35.48-.35Z" />
    </svg>
  )
}

export const PROVIDER_ICONS: Record<string, React.FC<IconProps>> = {
  OpenAI: OpenAIIcon,
  Anthropic: AnthropicIcon,
  Google: GeminiIcon,
  Meta: MetaIcon,
  DeepSeek: DeepSeekIcon,
  Mistral: MistralIcon,
  Qwen: QwenIcon,
}

export function getProviderIcon(provider: string): React.FC<IconProps> {
  return PROVIDER_ICONS[provider] || SparkleIcon
}
