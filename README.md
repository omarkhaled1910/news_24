# News-24

An automated Arabic news website built with Next.js 15 and Payload CMS v3. Automatically fetches videos from YouTube channels, extracts transcripts, generates AI-powered news articles, and publishes them through a modern Axios-style frontend.

## Features

- **Automated News Pipeline** - Fetches videos from YouTube channels, extracts transcripts, and generates articles automatically
- **AI Article Generation** - Uses GPT-4o-mini to write professional Arabic news articles from video transcripts
- **Payload CMS Admin** - Full content management system with draft/publish workflow
- **RTL/Arabic Support** - Complete Arabic interface with proper RTL layout
- **Modern Frontend** - Next.js 15 App Router with Server Components
- **Breaking News Ticker** - Real-time breaking news updates
- **Category Management** - Organize content by categories
- **SEO Optimized** - Built-in sitemap, meta tags, and structured data
- **Responsive Design** - Mobile, tablet, and desktop layouts

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15.4.11 (App Router) |
| CMS | Payload CMS 3.76.0 |
| Database | MongoDB |
| Language | TypeScript |
| Styling | TailwindCSS |
| AI | OpenAI GPT-4o-mini |
| YouTube discovery | youtubei.js (uploads + live tab) |
| Transcript extraction | yt-dlp (system binary — see [Prerequisites](#prerequisites)) |
| Media storage | Supabase Storage (S3-compatible) via `@payloadcms/storage-s3` |
| Automation | node-cron (in-process) and/or external cron → `/api/cron` |

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Automation Pipeline (every 5 min)              │
├──────────────────────────────────────────────────────────────────────┤
│  1. Pick ONE random active author                                     │
│     │                                                                 │
│  2. Load known videoIds for that author (to skip duplicates)          │
│     │                                                                 │
│  3. Fetch new uploads from the channel's Videos tab (youtubei.js)     │
│     │                                                                 │
│  4. ALWAYS also check the channel's Live tab for finished livestreams │
│     (in-progress/currently-live broadcasts are skipped until they end)│
│     │                                                                 │
│  5. If steps 3+4 found nothing new → fall back to backlog: retry      │
│     existing `videos` docs for this author stuck before               │
│     `article_generated` (no_transcript / transcribed / fetched / ...) │
│     │                                                                 │
│  6. For each video: extract transcript via yt-dlp (subs, then         │
│     auto-subs; requested language, then any language)                 │
│     │                                                                 │
│  7. Generate article text via OpenAI GPT-4o-mini                      │
│     │                                                                 │
│  8. Download thumbnail → upload in-memory to Payload Media            │
│     (routed to Supabase Storage by the S3 storage plugin — no disk)   │
│     │                                                                 │
│  9. Create + publish Article; on a slug collision (duplicate after    │
│     slugifying the AI-generated title) retry with a numeric suffix    │
│     │                                                                 │
│  10. Best-effort ISR revalidation (no-ops safely if the pipeline is   │
│      running outside a request context, e.g. the in-process cron)     │
└──────────────────────────────────────────────────────────────────────┘
```

Implementation: [`src/utilities/cron.ts`](src/utilities/cron.ts) (`runNewsPipeline`), triggered either by the
in-process `node-cron` scheduler ([`src/instrumentation.ts`](src/instrumentation.ts)) or by an HTTP call to
[`/api/cron`](src/app/api/cron/route.ts) — see [Running Automation](#running-automation).

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+
- OpenAI API key
- **`yt-dlp` installed on the host and available on `PATH`** — transcript extraction shells out to it
  (`src/utilities/transcript.ts`). It is a system binary, not an npm package, so `pnpm install` will
  **not** install it. Locally: `brew install yt-dlp` (macOS) or `pip install yt-dlp`. On your deployment
  host, make sure it's installed there too — without it, videos will always end up with
  `status: no_transcript` and no article gets generated.
- A Supabase project with Storage enabled (or another S3-compatible bucket) for media uploads

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd news-24

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Start MongoDB (using Docker)
docker-compose up -d

# Run development server
pnpm dev
```

### Environment Variables

Create a `.env` file (see [`.env.example`](.env.example) for placeholders). **Note:** the variable names the
code actually reads (`src/payload.config.ts`, `src/utilities/openai.ts`) use a `NEXT_PRIVATE_` prefix for
several of these, which differs from `.env.example` in a couple of spots — use the names below:

```bash
# Database (Mongo connection string)
NEXT_PRIVATE_DATABASE_URL=mongodb://localhost:27017/news24

# Payload CMS — used to encrypt JWT tokens
NEXT_PRIVATE_PAYLOAD_SECRET=<your-random-secret-key>

# Cron Job Security — required for the CRON_SECRET auth path on /api/cron
# (Vercel Cron requests are authenticated separately via the x-vercel-cron header)
CRON_SECRET=<your-cron-secret>

# Used to validate preview requests
PREVIEW_SECRET=<your-preview-secret>

# OpenAI (for article generation) — without this, the pipeline still fetches/transcribes
# videos but skips article generation and logs "OPENAI_API_KEY not set"
NEXT_PRIVATE_OPENAI_API_KEY=<your-openai-api-key>
# Optional, defaults to gpt-4o-mini
OPENAI_MODEL=gpt-4o-mini

# Next.js server URL (CORS, links, etc.)
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Supabase Storage (S3-compatible) — used for ALL media uploads (thumbnails, admin uploads),
# wired up via the `s3Storage` plugin in src/plugins/index.ts
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PRIVATE_SUPABASE_STORAGE_BUCKET_NAME=news-24
NEXT_PRIVATE_S3_ENDPOINT=https://your-project-ref.storage.supabase.co/storage/v1/s3
NEXT_PRIVATE_S3_ACCESS_KEY_ID=<from Supabase Dashboard → Storage → S3 connection>
NEXT_PRIVATE_S3_SECRET_ACCESS_KEY=<from Supabase Dashboard → Storage → S3 connection>
NEXT_PRIVATE_S3_REGION=eu-central-1

# Only set this to disable the in-process node-cron scheduler (e.g. on a platform where
# an external/Vercel Cron hits /api/cron instead) — see "Running Automation" below.
# START_CRON_JOBS=false
```

> **Note:** `NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY` (present in `.env.example`) is currently unused —
> thumbnail uploads go entirely through the `s3Storage` plugin now (`src/utilities/thumbnailDownloader.ts`),
> not a direct `@supabase/supabase-js` call. It's safe to leave unset.

## Project Structure

```
news-24/
├── src/
│   ├── app/
│   │   ├── (frontend)/           # Frontend pages
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── articles/         # Article pages
│   │   │   ├── globals.css       # Global styles
│   │   │   └── layout.tsx        # Root layout
│   │   └── api/                  # API routes
│   │       ├── cron/             # Pipeline trigger (Vercel Cron / manual)
│   │       └── reprocess-videos/ # Admin: retry stuck videos
│   ├── instrumentation.ts        # Starts the in-process cron scheduler on boot
│   ├── collections/              # Payload collections
│   │   ├── Articles/             # Articles collection + revalidateArticle hook
│   │   ├── Authors.ts            # YouTube authors/channels
│   │   ├── Videos.ts             # YouTube videos
│   │   ├── Categories.ts         # Content categories
│   │   ├── Media.ts              # Media management (S3/Supabase-backed)
│   │   ├── Pages/                # Static pages
│   │   └── Users/                # User management
│   ├── components/               # React components
│   │   ├── ArticleCard/          # Article card variants
│   │   ├── BreakingNews/         # Breaking news ticker
│   │   ├── HeroArticle/          # Hero section
│   │   ├── Sidebar/              # Sidebar component
│   │   ├── Footer/               # Site footer
│   │   ├── Header/               # Site header
│   │   └── Logo/                 # Logo component
│   ├── utilities/                # Backend utilities
│   │   ├── cron.ts               # Pipeline: author selection, backlog fallback, slug retries
│   │   ├── youtube.ts            # YouTube video + live discovery (youtubei.js)
│   │   ├── transcript.ts         # Transcript extraction (yt-dlp)
│   │   ├── openai.ts             # AI article generation
│   │   └── thumbnailDownloader.ts # In-memory thumbnail upload (no disk I/O)
│   ├── plugins/                  # Payload plugins (incl. s3Storage → Supabase)
│   ├── payload.config.ts         # Payload configuration
│   └── types/                    # TypeScript types
├── public/                       # Static assets
├── docker-compose.yml            # MongoDB container
├── next.config.js                # Next.js config
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config
```

## Usage

### Managing Authors

1. Access the Payload Admin at `http://localhost:3000/admin`
2. Navigate to **Authors**
3. Add a new YouTube author:
   - **Name**: Author display name
   - **YouTube Channel ID**: The channel ID from YouTube URL
   - **Language**: Select language (default: Arabic)
   - **Active**: Enable to include in automation

### Running Automation

The pipeline processes **one randomly-selected active author per run** and runs every 5 minutes
(`*/5 * * * *` in `src/utilities/cron.ts`). There are two independent ways it gets triggered — both call
the exact same `runNewsPipeline()` function:

1. **In-process `node-cron` scheduler** — started automatically by `src/instrumentation.ts` on server boot
   (Node.js runtime only, and only when `START_CRON_JOBS` is *not* set). This also fires once ~10s after
   startup. This is what runs during local `pnpm dev`.
2. **`GET /api/cron`** — an HTTP route you can point an external scheduler (Vercel Cron, a system crontab,
   etc.) at. Useful on platforms where a long-lived in-process timer isn't appropriate.

> **Known gap:** `vercel.json` in this repo has no `crons` entry, so nothing currently calls `/api/cron`
> automatically on Vercel — the in-process scheduler (path 1) is what actually runs the pipeline wherever
> this app is deployed, as long as it's a persistent Node.js process (not a stateless serverless function,
> where an in-process timer wouldn't survive between invocations). If you deploy to Vercel functions, add a
> `crons` entry pointing at `/api/cron` and set `START_CRON_JOBS=true` to avoid running the pipeline twice.

```bash
# Manually trigger a run (any one of the three auth methods below works)
curl "http://localhost:3000/api/cron?secret=<your-cron-secret>"
# or
curl http://localhost:3000/api/cron -H "Authorization: Bearer <your-cron-secret>"
```

### Managing Articles

- **Draft**: Articles are created as draft by default
- **Review**: Edit articles in the admin panel
- **Publish**: Publish when ready to appear on the site

## Automation Pipeline Details

### 1. Author selection & backlog fallback (`src/utilities/cron.ts`)

Each run picks **one** random active author (not all of them), so coverage across authors evens out over
many runs rather than hammering every channel every 5 minutes. `processWorkItem()` handles two kinds of
work uniformly:
- `{ kind: 'new' }` — a video just discovered from YouTube → creates a new `videos` record first.
- `{ kind: 'backlog' }` — an existing `videos` record whose `status` never reached `article_generated`
  (e.g. `no_transcript` because `yt-dlp` failed transiently, or `transcribed` because the OpenAI key was
  missing at the time) → reuses that record and picks up from wherever it left off, instead of creating a
  duplicate. This backlog fallback only kicks in when the current run's Videos-tab + Live-tab fetch both
  come back empty.

### 2. YouTube Video & Live Discovery (`src/utilities/youtube.ts`)

Uses `youtubei.js` against the channel's v17 `LockupView`/`RichItem` feed structure:
- `fetchChannelVideos()` — the channel's regular Videos tab, paginating via continuations until it
  collects `maxResults` videos not already in the caller's `skipVideoIds` set (default cap: 5 per run,
  5 pages max).
- `fetchChannelLiveVideos()` — the channel's **Live tab**, checked on *every* run regardless of whether
  new uploads were found. Some channels publish their real long-form content as finished livestreams
  rather than regular uploads, so this isn't just a fallback — it's a real content source. A stream still
  in progress is filtered out via `isVideoCurrentlyLive()` (`getBasicInfo().is_live`), since there's no
  final transcript for it yet; finished ones are treated like any other video.
- Video metadata is limited to what the list feed actually exposes (title, thumbnail, view count) —
  `description` and `duration` aren't available without an extra `getBasicInfo()` call per video, and
  `publishedAt` falls back to "now" since YouTube only returns relative strings here ("قبل 10 ساعات").

### 3. Transcript Extraction (`src/utilities/transcript.ts`)

Shells out to the **`yt-dlp` system binary** (not an npm package — see [Prerequisites](#prerequisites)) via
`child_process.exec`, with retries (up to 3, exponential backoff) on transient failures like rate-limiting
or timeouts:
1. Manual + auto-generated subs in the author's configured language (`--sub-lang <lang>`)
2. Falls back to auto-generated subs in **any** available language
3. Parses the downloaded `json3` (or `.vtt` as a fallback) subtitle file into plain text

Returns `null` if neither attempt finds subtitles, which the pipeline records as `status: no_transcript`
(and retries later via the backlog fallback above — it isn't a dead end).

### 4. AI Article Generation (`src/utilities/openai.ts`)

Uses GPT-4o-mini (`NEXT_PRIVATE_OPENAI_API_KEY`, model overridable via `OPENAI_MODEL`) with Arabic-specific
prompts:
- Neutral, journalistic writing style
- No hallucinations - only facts from transcript
- Proper source attribution
- Structured output with title, excerpt, content, tags, and category
- HTML to Lexical JSON conversion for Payload

If the key isn't set, the pipeline still fetches videos and extracts transcripts (`status: transcribed`) but
skips article generation, logging `OPENAI_API_KEY not set` — those videos get picked up again once a key
is configured, via the backlog fallback.

### 5. Slug collisions (`src/collections/Articles/index.ts`, `src/utilities/cron.ts`)

Article slugs are generated from the AI-generated title via a custom `slugifyArabicText()` (Payload's
default slugify strips non-ASCII text, which would destroy Arabic titles). Since the `slug` field is
unique and multiple videos on the same topic can produce similar or identical OpenAI-generated titles, a
duplicate-slug create is detected (`isDuplicateSlugError()`, matching Payload's `ValidationError` on the
`slug` field) and retried with a numeric suffix (`-2`, `-3`, …) up to 5 times, instead of losing the article.

### 6. Thumbnail Handling (`src/utilities/thumbnailDownloader.ts`)

- Downloads the thumbnail into an in-memory `Buffer` (no disk I/O)
- Uploads it directly via Payload's local API (`payload.create({ file: { data: buffer, ... } })`), with a
  random UUID filename (non-ASCII filenames break the S3-compatible key format)
- That upload is routed to Supabase Storage by the `s3Storage` plugin (`src/plugins/index.ts`), which also
  generates the public object URLs and handles Payload's configured `imageSizes` (thumbnail/square/small/
  medium/large/xlarge/og) via `sharp` — sizes larger than the source thumbnail are simply skipped, not an
  error.

### 7. Revalidation (`src/collections/Articles/hooks/revalidateArticle.ts`)

An `afterChange` hook calls `revalidatePath`/`revalidateTag` on publish. These Next.js APIs only work
inside an active request context, which the in-process cron scheduler doesn't have — that specific failure
is caught and logged as informational rather than an error, since it's harmless here: the article detail
page is `export const dynamic = 'force-dynamic'` (always rendered fresh, nothing to invalidate) and the
homepage has its own 60s time-based cache fallback (`unstable_cache(..., { revalidate: 60 })`) regardless.

## Frontend Components

### Homepage (`src/app/(frontend)/page.tsx`)

- **Hero Article**: Large featured article with breaking news badge
- **Breaking News Ticker**: Scrolling ticker for urgent updates
- **Latest Articles**: 8-card grid of recent articles
- **Sidebar**: Latest articles + category navigation

### Article Pages

- **Listing**: `/articles` - Filterable, paginated article list
- **Detail**: `/articles/[slug]` - Full article view with sidebar

### Components

| Component | Description |
|-----------|-------------|
| `HeroArticle` | Large featured article with overlay |
| `ArticleCard` | Multiple variants (default, compact, horizontal) |
| `BreakingNews` | Auto-scrolling ticker |
| `Sidebar` | Latest articles + categories |

## API Endpoints

### GET `/api/cron`

Triggers one pipeline run (see [Running Automation](#running-automation) — same function the in-process
scheduler calls). Accepts any **one** of three auth methods:

- `x-vercel-cron: 1` header (sent automatically by Vercel Cron)
- `Authorization: Bearer <CRON_SECRET>` header
- `?secret=<CRON_SECRET>` query param

**Response:**
```json
{
  "success": true,
  "message": "News pipeline completed",
  "processed": 5,
  "articles": 5,
  "errors": 0
}
```
`processed` counts newly-created `videos` records (new uploads/lives only, not backlog reprocessing);
`articles` counts articles created either way.

### POST `/api/reprocess-videos`

Admin-authenticated (Payload session required) maintenance endpoint. Deletes all `videos` records stuck at
`no_transcript` or `failed` across **all** authors, then immediately runs the pipeline once. Largely
superseded for `no_transcript` by the backlog fallback (which now retries those records in place rather
than deleting them), but still useful to force an immediate retry rather than waiting for that author to
be randomly selected again.

## Deployment

### Production Checklist

1. Set all environment variables (see [Environment Variables](#environment-variables))
2. Confirm **`yt-dlp` is installed on the production host** — see [Prerequisites](#prerequisites); this is
   easy to miss since it's not part of `pnpm install`, and its absence fails silently into
   `status: no_transcript` rather than a loud error
3. Configure production MongoDB (MongoDB Atlas recommended)
4. Decide how the pipeline gets triggered in production — the in-process scheduler (default) only works on
   a persistent Node.js server; on serverless platforms, wire up an external/Vercel Cron to `/api/cron` and
   set `START_CRON_JOBS=true` (see the **Known gap** note under [Running Automation](#running-automation))
5. Configure CDN for media assets
6. Enable sitemap generation

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add the environment variables listed in [Environment Variables](#environment-variables) in Vercel's project
settings, and remember the **Known gap** above — a `crons` entry needs to be added to `vercel.json` for
`/api/cron` to actually get called on Vercel.

## Development

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Type check
pnpm type-check
```

## Collection Schemas

### Authors

| Field | Type | Description |
|-------|------|-------------|
| name | Text | Author display name |
| channelId | Text | YouTube channel ID |
| channelUrl | Text | Full YouTube channel URL |
| handle | Text | YouTube handle (@username) |
| thumbnailUrl | Text | Channel thumbnail URL |
| photo | Upload | Author profile photo |
| bio | Textarea | Author biography |
| description | Textarea | Channel description |
| subscriberCount | Number | Channel subscriber count |
| videoCount | Number | Total videos on channel |
| viewCount | Number | Total channel views |
| language | Select | ar / en |
| active | Boolean | Enable/disable automation |
| featured | Boolean | Show in featured section |
| lastFetchedAt | Date | Last fetch timestamp |
| fetchCount | Number | Total fetch count |

### Videos

| Field | Type | Description |
|-------|------|-------------|
| title | Text | Video title |
| videoId | Text | YouTube video ID |
| youtubeUrl | Text | Full YouTube video URL |
| author | Relationship | Source author |
| description | Textarea | Video description |
| thumbnailUrl | Text | Video thumbnail URL |
| duration | Text | Video duration |
| transcript | Textarea | Extracted transcript |
| transcriptLanguage | Text | Transcript language (ar/en) |
| status | Select | pending / fetched / transcribed / article_generated / failed / no_transcript |
| errorMessage | Text | Error details if failed |
| publishedAt | Date | YouTube publish date |
| viewCount | Number | View count |

### Articles

| Field | Type | Description |
|-------|------|-------------|
| title | Text | Article title |
| slug | Text | URL slug (unique; Arabic-aware slugify, see [Slug collisions](#5-slug-collisions-srccollectionsarticlesindexts-srcutilitiescronts)) |
| heroImage | Upload | Hero image (set from the video thumbnail when the pipeline creates it) |
| excerpt | Text | Article summary |
| content | RichText | Article content (Lexical) |
| sourceVideo | Relationship | Source YouTube video |
| youtubeUrl | Text | Link back to the source YouTube video |
| isAutoGenerated | Boolean | AI-generated flag |
| transcript | Textarea | Transcript (truncated to 15,000 chars) |
| transcriptLanguage | Text | Transcript language (ar/en) |
| categories | Relationship (hasMany) | Article categories (set from the author's category) |
| relatedArticles | Relationship (hasMany) | Manually or automatically related articles |
| tags | Array | AI-generated tags |
| author | Relationship | Source author |
| authorName | Text | Denormalized author display name |
| publishedAt | Date | Publish date |
| featured | Boolean | Show in hero section |
| breakingNews | Boolean | Show in ticker |

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
