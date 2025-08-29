'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog } from '@/lib/posthog'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        // Initialize PostHog
        const posthog = initPostHog()

        // Track page views
        if (pathname) {
            let url = window.origin + pathname
            if (searchParams && searchParams.toString()) {
                url = url + `?${searchParams.toString()}`
            }
            posthog.capture('$pageview', {
                $current_url: url,
            })
        }
    }, [pathname, searchParams])

    return <>{children}</>
}
