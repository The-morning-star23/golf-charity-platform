import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // 1. THE FAST PASS: Skip everything for Stripe webhooks
  if (request.nextUrl.pathname.startsWith('/api/webhooks/stripe')) {
    return NextResponse.next()
  }

  // 2. THE SESSION BOUNCER: Refresh the session and get the initial response
  const response = await updateSession(request)

  // 3. THE SECURITY GUARD (Role-Based Access Control)
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin')

  if (isDashboard || isAdminPath) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return response

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    // RULE A: Protect the Admin territory from players
    if (isAdminPath && !profile?.is_admin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // RULE B: Smarter Redirect for Admins (The "Dual-Role" Logic)
    if (isDashboard && profile?.is_admin) {
      const referer = request.headers.get('referer')
      
      // If there is no referer (direct URL type-in) or they are coming from 
      // the landing page/login, send them to the Command Center by default.
      if (!referer || referer.endsWith('/') || referer.endsWith('/login')) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      
      // If they are navigating FROM the admin panel or within the app, 
      // let them stay on the /dashboard to view their player stats.
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api/webhooks/stripe|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}