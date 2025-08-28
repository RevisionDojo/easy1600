import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// POST /api/auth/refresh - Refresh authentication session
export async function POST() {
    try {
        const supabase = createServerSupabaseClient()

        // Refresh the session
        const { data, error } = await supabase.auth.refreshSession()

        if (error) {
            return NextResponse.json(
                { error: 'Failed to refresh session', details: error.message },
                { status: 401 }
            )
        }

        if (!data.session || !data.user) {
            return NextResponse.json(
                { error: 'No valid session to refresh' },
                { status: 401 }
            )
        }

        return NextResponse.json({
            user: {
                id: data.user.id,
                email: data.user.email,
                email_confirmed_at: data.user.email_confirmed_at,
                created_at: data.user.created_at,
                updated_at: data.user.updated_at
            },
            session: {
                access_token: data.session.access_token,
                expires_at: data.session.expires_at,
                expires_in: data.session.expires_in
            },
            refreshed: true
        })
    } catch (error) {
        console.error('Refresh session error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
