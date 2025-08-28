import { createBrowserClient } from '@supabase/ssr'
import Cookies from 'js-cookie'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqobxogmxreudzfyaxbq.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxb2J4b2dteHJldWR6ZnlheGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTM4OTIsImV4cCI6MjA3MTkyOTg5Mn0.MjtWZXXAKpFmxVagY5dpxyMkqgLZGL75fyjiyla3Jqs'

// Client-side Supabase client with cookie handling
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
        getAll() {
            return document.cookie
                .split(';')
                .map(cookie => cookie.trim().split('='))
                .reduce((acc, [name, value]) => {
                    if (name && value) {
                        acc[name] = decodeURIComponent(value)
                    }
                    return acc
                }, {} as Record<string, string>)
        },
        setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
                Cookies.set(name, value, {
                    ...options,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax'
                })
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
