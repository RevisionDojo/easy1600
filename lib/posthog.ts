import posthog from 'posthog-js'

export function initPostHog() {
    if (typeof window !== 'undefined' && !posthog.__loaded) {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
            person_profiles: 'identified_only',
            capture_pageview: false, // Disable automatic pageview capture, as we capture manually
            capture_pageleave: true,
            loaded: (posthog) => {
                if (process.env.NODE_ENV === 'development') console.log('PostHog loaded')
            }
        })
    }
    return posthog
}

// Helper function to capture custom events
export function captureEvent(eventName: string, properties?: Record<string, any>) {
    if (typeof window !== 'undefined') {
        posthog.capture(eventName, properties)
    }
}

// Helper function to identify users
export function identifyUser(userId: string, properties?: Record<string, any>) {
    if (typeof window !== 'undefined') {
        posthog.identify(userId, properties)
    }
}
