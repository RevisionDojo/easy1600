import { NextResponse } from 'next/server'
import { serverAuthHelpers } from '@/lib/supabase-server'

// GET /api/auth/user - Get current authenticated user
export async function GET() {
    try {
        const { user, error } = await serverAuthHelpers.validateSession()

        if (error) {
            return NextResponse.json(
                { error: 'Authentication required', details: error.message },
                { status: 401 }
            )
        }

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Return safe user data (exclude sensitive information)
        return NextResponse.json({
            id: user.id,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
            created_at: user.created_at,
            updated_at: user.updated_at,
            user_metadata: user.user_metadata,
            app_metadata: user.app_metadata
        })
    } catch (error) {
        console.error('Get user error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
