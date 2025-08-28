import { createBrowserClient } from '@supabase/ssr'
import Cookies from 'js-cookie'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqobxogmxreudzfyaxbq.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxb2J4b2dteHJldWR6ZnlheGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTM4OTIsImV4cCI6MjA3MTkyOTg5Mn0.MjtWZXXAKpFmxVagY5dpxyMkqgLZGL75fyjiyla3Jqs'

// Client-side Supabase client with cookie handling
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
        getAll() {
            if (typeof document === 'undefined') {
                return []
            }

            return document.cookie
                .split(';')
                .map(cookie => {
                    const [name, ...rest] = cookie.trim().split('=')
                    const value = rest.join('=')
                    return { name: name || '', value: value || '' }
                })
                .filter(cookie => cookie.name)
        },
        setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
                if (typeof document !== 'undefined') {
                    // Convert Supabase cookie options to js-cookie format
                    const cookieOptions: any = {
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax'
                    }

                    if (options) {
                        // Handle maxAge (convert to expires date)
                        if (options.maxAge) {
                            cookieOptions.expires = new Date(Date.now() + options.maxAge * 1000)
                        }

                        // Handle other standard options
                        if (options.domain) cookieOptions.domain = options.domain
                        if (options.path) cookieOptions.path = options.path
                        if (options.secure !== undefined) cookieOptions.secure = options.secure
                        if (options.sameSite) cookieOptions.sameSite = options.sameSite
                        if (options.httpOnly !== undefined) {
                            // Note: httpOnly cannot be set from client-side JavaScript
                            // This is handled by the server-side cookie implementation
                        }
                    }

                    Cookies.set(name, value, cookieOptions)
                }
            })
        }
    }
})

// Auth helper functions
export const authHelpers = {
    // Sign up with email and password
    async signUp(email: string, password: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        })
        return { data, error }
    },

    // Sign in with email and password
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        return { data, error }
    },

    // Sign out
    async signOut() {
        const { error } = await supabase.auth.signOut()
        return { error }
    },

    // Resend email verification
    async resendVerification(email: string) {
        const { data, error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        })
        return { data, error }
    },

    // Get current user
    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser()
        return { user, error }
    },

    // Get current session
    async getCurrentSession() {
        const { data: { session }, error } = await supabase.auth.getSession()
        return { session, error }
    }
}
