import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase-server'

// Define protected routes that require authentication
const protectedRoutes = [
    '/api/questions',
    '/api/exams',
    '/api/user'
]

// Define public routes that don't require authentication
const publicRoutes = [
    '/',
    '/auth/callback',
    '/api/auth'
]

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Skip middleware for static files and Next.js internals
    if (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/api/_next/') ||
        pathname.includes('.') ||
        pathname.startsWith('/favicon')
    ) {
        return NextResponse.next()
    }

    // Create Supabase client for middleware
    const { supabase, supabaseResponse } = createMiddlewareSupabaseClient(request)

    // Refresh session if expired
    const { data: { session }, error } = await supabase.auth.getSession()

    // Check if route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname.startsWith(route)
    )

    // If it's a protected route and user is not authenticated
    if (isProtectedRoute && (!session || error)) {
        // For API routes, return 401
        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // For page routes, redirect to home with auth popup trigger
        const redirectUrl = new URL('/', request.url)
        redirectUrl.searchParams.set('auth', 'required')
        redirectUrl.searchParams.set('redirect', pathname)

        return NextResponse.redirect(redirectUrl)
    }

    // For authenticated users accessing auth callback
    if (pathname === '/auth/callback' && session) {
        // Check if there's a redirect parameter
        const redirectTo = request.nextUrl.searchParams.get('redirect') || '/'
        return NextResponse.redirect(new URL(redirectTo, request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
