import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server-side Supabase client for API routes and server components
export const createServerSupabaseClient = () => {
    const cookieStore = cookies()

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                } catch {
                    // The `setAll` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
        },
    })
}

// Middleware Supabase client
export const createMiddlewareSupabaseClient = (request: NextRequest) => {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                supabaseResponse = NextResponse.next({
                    request,
                })
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                )
            },
        },
    })

    return { supabase, supabaseResponse }
}

// Auth helpers for server-side operations
export const serverAuthHelpers = {
    // Get current user on server
    async getCurrentUser() {
        const supabase = createServerSupabaseClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        return { user, error }
    },

    // Get current session on server
    async getCurrentSession() {
        const supabase = createServerSupabaseClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        return { session, error }
    },

    // Validate session and return user
    async validateSession() {
        const { session, error } = await this.getCurrentSession()

        if (error || !session) {
            return { user: null, session: null, error }
        }

        return { user: session.user, session, error: null }
    },

    // Check if user is authenticated
    async isAuthenticated() {
        const { user } = await this.validateSession()
        return !!user
    },

    // Get user with error handling
    async requireAuth() {
        const { user, error } = await this.validateSession()

        if (!user) {
            throw new Error('Authentication required')
        }

        return { user, error }
    }
}
