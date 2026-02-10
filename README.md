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
| YouTube | youtubei.js, youtube-transcript |
| Automation | node-cron |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Automation Pipeline                         │
├─────────────────────────────────────────────────────────────────┤
│  1. Cron Job (every 30 min)                                    │
│     │                                                           │
│  2. Fetch active authors from Payload                           │
│     │                                                           │
│  3. Get latest videos from YouTube (youtubei.js)                │
│     │                                                           │
│  4. Extract transcript (youtube-transcript)                     │
│     │                                                           │
│  5. Generate article (OpenAI GPT-4o-mini)                       │
│     │                                                           │
│  6. Download & upload thumbnail to Payload Media                │
│     │                                                           │
│  7. Create Article in Payload CMS                               │
│     │                                                           │
│  8. Display on Next.js frontend                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+
- OpenAI API key

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

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URI=mongodb://localhost:27017/news24

# Payload CMS
PAYLOAD_SECRET=<your-random-secret-key>

# Cron Job Security
CRON_SECRET=<your-cron-secret>

# OpenAI (for article generation)
OPENAI_API_KEY=<your-openai-api-key>

# Optional: Next.js
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

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
│   │       └── cron/             # Manual cron trigger
│   ├── collections/              # Payload collections
│   │   ├── Articles/             # Articles collection
│   │   ├── Authors.ts            # YouTube authors/channels
│   │   ├── Videos.ts             # YouTube videos
│   │   ├── Categories.ts         # Content categories
│   │   ├── Media.ts              # Media management
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
│   │   ├── cron.ts               # Scheduled jobs
│   │   ├── youtube.ts            # YouTube API integration
│   │   ├── transcript.ts         # Transcript extraction
│   │   ├── openai.ts             # AI article generation
│   │   └── thumbnailDownloader.ts # Media handling
│   ├── plugins/                  # Payload plugins
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

The automation runs automatically every 30 minutes. You can also trigger it manually:

```bash
# Via API (requires CRON_SECRET)
curl -X POST http://localhost:3000/api/cron \
  -H "Authorization: Bearer <your-cron-secret>"
```

### Managing Articles

- **Draft**: Articles are created as draft by default
- **Review**: Edit articles in the admin panel
- **Publish**: Publish when ready to appear on the site

## Automation Pipeline Details

### 1. YouTube Video Fetching (`src/utilities/youtube.ts`)

Uses `youtubei.js` to fetch the latest videos from configured authors:
- Extracts video metadata (title, description, thumbnail, duration, views)
- Fetches configurable number of videos per author (default: 5)

### 2. Transcript Extraction (`src/utilities/transcript.ts`)

Implements a fallback strategy for maximum reliability:
1. Primary: `youtube-transcript` (official API)
2. Fallback: `youtube-caption-scraper`
3. Last resort: Auto-generated captions

### 3. AI Article Generation (`src/utilities/openai.ts`)

Uses GPT-4o-mini with Arabic-specific prompts:
- Neutral, journalistic writing style
- No hallucinations - only facts from transcript
- Proper source attribution
- Structured output with title, excerpt, content, tags, and category
- HTML to Lexical JSON conversion for Payload

### 4. Thumbnail Handling (`src/utilities/thumbnailDownloader.ts`)

- Downloads high-quality thumbnails from YouTube
- Uploads to Payload Media collection
- Handles optimization and caching

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

### POST `/api/cron`

Manually trigger the automation pipeline.

**Headers:**
```
Authorization: Bearer <CRON_SECRET>
```

**Response:**
```json
{
  "success": true,
  "authorsProcessed": 5,
  "videosFetched": 25,
  "articlesGenerated": 20,
  "errors": []
}
```

## Deployment

### Production Checklist

1. Set all environment variables
2. Configure production MongoDB (MongoDB Atlas recommended)
3. Set up cron job or external scheduler (e.g., Vercel Cron)
4. Configure CDN for media assets
5. Enable sitemap generation

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add the following environment variables in Vercel:
- `DATABASE_URI`
- `PAYLOAD_SECRET`
- `CRON_SECRET`
- `OPENAI_API_KEY`

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
| slug | Text | URL slug (unique) |
| content | RichText | Article content (Lexical) |
| excerpt | Text | Article summary |
| sourceVideo | Relationship | Source YouTube video |
| category | Relationship | Article category |
| featured | Boolean | Show in hero section |
| breakingNews | Boolean | Show in ticker |
| autoGenerated | Boolean | AI-generated flag |

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
