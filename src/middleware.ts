import { NextResponse, type NextRequest } from 'next/server'

const LOCALES = new Set(['en', 'ar'])

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // Ignore Next internals & API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]

  if (!first || !LOCALES.has(first)) return NextResponse.next()

  // Strip locale prefix (/en/foo -> /foo) and set locale cookie
  const rest = segments.slice(1).join('/')
  const nextPathname = `/${rest}`

  const url = req.nextUrl.clone()
  url.pathname = nextPathname === '/' ? '/' : nextPathname.replace(/\/+$/, '')
  url.search = search

  const res = NextResponse.redirect(url)
  res.cookies.set('locale', first, { path: '/', sameSite: 'lax' })
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

