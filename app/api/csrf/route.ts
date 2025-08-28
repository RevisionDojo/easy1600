import { NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/csrf'

// GET /api/csrf - Get CSRF token
export async function GET() {
    try {
        const token = generateCSRFToken()

        return NextResponse.json({
            token,
            expires: Date.now() + (60 * 60 * 1000) // 1 hour from now
        })
    } catch (error) {
        console.error('CSRF token generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate CSRF token' },
            { status: 500 }
        )
    }
}
