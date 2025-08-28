'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Cookies from 'js-cookie'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signOut: () => Promise<void>
    refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
    refreshSession: async () => { }
})

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        }

        getInitialSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session)
                setUser(session?.user ?? null)
                setLoading(false)

                // Sync auth state with cookies and server
                if (session) {
                    // Set auth cookie for server-side access
                    Cookies.set('sb-auth-token', session.access_token, {
                        expires: new Date(session.expires_at! * 1000),
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax'
                    })
                } else {
                    // Remove auth cookie on sign out
                    Cookies.remove('sb-auth-token')
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
        // Clear auth cookie
        Cookies.remove('sb-auth-token')
    }

    const refreshSession = async () => {
        try {
            const { data, error } = await supabase.auth.refreshSession()
            if (error) throw error

            if (data.session) {
                setSession(data.session)
                setUser(data.session.user)

                // Update auth cookie
                Cookies.set('sb-auth-token', data.session.access_token, {
                    expires: new Date(data.session.expires_at! * 1000),
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax'
                })
            }
        } catch (error) {
            console.error('Failed to refresh session:', error)
            // Clear invalid session
            setSession(null)
            setUser(null)
            Cookies.remove('sb-auth-token')
        }
    }

    const value = {
        user,
        session,
        loading,
        signOut,
        refreshSession
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
