import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // 1. HARD GUARD: If the request is for the Stripe webhook, skip everything.
  // We do not want Supabase to touch this request because it has no session.
  if (request.nextUrl.pathname.startsWith('/api/webhooks/stripe')) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/webhooks/stripe (The Fast Pass)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - all images
     */
    '/((?!api/webhooks/stripe|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}