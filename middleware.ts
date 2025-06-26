import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // This also handles session persistence by attempting to refresh the session
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession()

  // If there's a session error, try to refresh the session
  let refreshedSession = session
  if (sessionError && !session) {
    try {
      const { data: { session: newSession } } = await supabase.auth.refreshSession()
      refreshedSession = newSession
    } catch (refreshError) {
      console.error('Failed to refresh session:', refreshError)
    }
  }

  const { pathname, searchParams } = request.nextUrl

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/callback',
    '/auth/reset-password',
    '/auth/verify-email',
  ]

  // Define protected routes that require authentication
  const protectedRoutes = [
    '/projects',
    '/dashboard',
    '/profile',
    '/settings',
  ]

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Handle authentication callback route
  if (pathname === '/auth/callback') {
    // Let the callback page handle the session
    return response
  }

  // If user is not authenticated and trying to access protected route
  if (!refreshedSession && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    
    // Preserve the original destination for post-login redirect
    if (pathname !== '/auth/login') {
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      
      // Preserve existing search params
      if (searchParams.toString()) {
        redirectUrl.searchParams.set('originalParams', searchParams.toString())
      }
    }
    
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth pages, redirect appropriately
  if (refreshedSession && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
    const redirectUrl = request.nextUrl.clone()
    
    // Check if there's a redirectedFrom parameter to return to original destination
    const redirectedFrom = searchParams.get('redirectedFrom')
    const originalParams = searchParams.get('originalParams')
    
    if (redirectedFrom && protectedRoutes.some(route => redirectedFrom.startsWith(route))) {
      redirectUrl.pathname = redirectedFrom
      
      // Restore original search params
      if (originalParams) {
        const params = new URLSearchParams(originalParams)
        params.forEach((value, key) => {
          redirectUrl.searchParams.set(key, value)
        })
      }
    } else {
      // Default redirect to projects page
      redirectUrl.pathname = '/projects'
    }
    
    // Clear the redirect parameters
    redirectUrl.searchParams.delete('redirectedFrom')
    redirectUrl.searchParams.delete('originalParams')
    
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and on home page, redirect to projects
  if (refreshedSession && pathname === '/') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/projects'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 