import { NextRequest, NextResponse } from 'next/server'
import { serverAuthHelpers } from '@/lib/supabase-server'

// GET /api/auth/session - Get current session
export async function GET() {
    try {
        const { user, session, error } = await serverAuthHelpers.validateSession()

        if (error) {
            return NextResponse.json(
                { error: 'Session validation failed', details: error.message },
                { status: 401 }
            )
        }

        if (!user || !session) {
            return NextResponse.json(
                { user: null, session: null, authenticated: false },
                { status: 200 }
            )
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                email_confirmed_at: user.email_confirmed_at,
                created_at: user.created_at,
                updated_at: user.updated_at
            },
            session: {
                access_token: session.access_token,
                expires_at: session.expires_at,
                expires_in: session.expires_in
            },
            authenticated: true
        })
    } catch (error) {
        console.error('Session check error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE /api/auth/session - Sign out
export async function DELETE() {
    try {
        const { user } = await serverAuthHelpers.validateSession()

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // The actual sign out is handled by the client-side Supabase client
        // This endpoint is mainly for server-side validation
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Sign out error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
