import { NextRequest } from 'next/server'
import { randomBytes, createHmac } from 'crypto'

const CSRF_SECRET = process.env.CSRF_SECRET || 'your-csrf-secret-key-change-in-production'
const CSRF_TOKEN_LENGTH = 32

// Generate a CSRF token
export function generateCSRFToken(): string {
    const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
    const timestamp = Date.now().toString()
    const signature = createHmac('sha256', CSRF_SECRET)
        .update(`${token}:${timestamp}`)
        .digest('hex')

    return `${token}:${timestamp}:${signature}`
}

// Validate a CSRF token
export function validateCSRFToken(token: string): boolean {
    try {
        const [tokenPart, timestampPart, signature] = token.split(':')

        if (!tokenPart || !timestampPart || !signature) {
            return false
        }

        // Check if token is not too old (1 hour)
        const timestamp = parseInt(timestampPart)
        const now = Date.now()
        const maxAge = 60 * 60 * 1000 // 1 hour in milliseconds

        if (now - timestamp > maxAge) {
            return false
        }

        // Verify signature
        const expectedSignature = createHmac('sha256', CSRF_SECRET)
            .update(`${tokenPart}:${timestampPart}`)
            .digest('hex')

        return signature === expectedSignature
    } catch {
        return false
    }
}

// Extract CSRF token from request headers
export function getCSRFTokenFromRequest(request: NextRequest): string | null {
    // Check X-CSRF-Token header first
    const headerToken = request.headers.get('X-CSRF-Token')
    if (headerToken) {
        return headerToken
    }

    // Check form data for POST requests
    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/x-www-form-urlencoded')) {
        // This would need to be handled in the API route where form data is parsed
        return null
    }

    return null
}

// CSRF middleware helper
export function requireCSRFToken(request: NextRequest): boolean {
    const method = request.method.toUpperCase()

    // Only require CSRF for state-changing methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return true
    }

    const token = getCSRFTokenFromRequest(request)
    if (!token) {
        return false
    }

    return validateCSRFToken(token)
}

// Client-side CSRF token management
export const csrfHelpers = {
    // Get CSRF token from meta tag or generate new one
    getToken(): string {
        if (typeof window === 'undefined') {
            return ''
        }

        // Try to get from meta tag first
        const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        if (metaToken) {
            return metaToken
        }

        // Generate new token and store in sessionStorage
        const newToken = generateCSRFToken()
        sessionStorage.setItem('csrf-token', newToken)
        return newToken
    },

    // Add CSRF token to fetch headers
    getHeaders(): Record<string, string> {
        return {
            'X-CSRF-Token': this.getToken()
        }
    },

    // Fetch wrapper with CSRF protection
    async fetch(url: string, options: RequestInit = {}): Promise<Response> {
        const method = options.method?.toUpperCase() || 'GET'

        // Add CSRF token for state-changing requests
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            options.headers = {
                ...options.headers,
                ...this.getHeaders()
            }
        }

        return fetch(url, options)
    }
}
