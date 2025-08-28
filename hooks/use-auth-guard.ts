'use client'

import { useAuth } from '@/contexts/auth-context'
import { useState } from 'react'

export const useAuthGuard = () => {
    const { user, loading } = useAuth()
    const [showAuthPopup, setShowAuthPopup] = useState(false)

    const requireAuth = (callback?: () => void) => {
        if (loading) return false

        if (!user) {
            setShowAuthPopup(true)
            return false
        }

        // User is authenticated, execute callback if provided
        callback?.()
        return true
    }

    const closeAuthPopup = () => {
        setShowAuthPopup(false)
    }

    const handleAuthSuccess = (callback?: () => void) => {
        setShowAuthPopup(false)
        callback?.()
    }

    return {
        user,
        loading,
        isAuthenticated: !!user,
        showAuthPopup,
        requireAuth,
        closeAuthPopup,
        handleAuthSuccess
    }
}
