declare module 'youtube-caption-scraper' {
  interface SubtitleOptions {
    videoID: string
    lang?: string
  }

  interface SubtitleEntry {
    start: string
    dur: string
    text: string
  }

  export function getSubtitles(options: SubtitleOptions): Promise<SubtitleEntry[]>
}
