'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AuthCallbackPage() {
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                const { data, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('Auth callback error:', error)
                    setStatus('error')
                    setMessage(error.message)
                    return
                }

                if (data.session) {
                    setStatus('success')
                    setMessage('Email verified successfully! You are now signed in.')

                    // Redirect to home page after a short delay
                    setTimeout(() => {
                        router.push('/')
                    }, 2000)
                } else {
                    setStatus('error')
                    setMessage('No session found. Please try signing in again.')
                }
            } catch (err) {
                console.error('Unexpected error:', err)
                setStatus('error')
                setMessage('An unexpected error occurred. Please try again.')
            }
        }

        handleAuthCallback()
    }, [router])

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-card border rounded-lg p-8 text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-primary" />
                        <h1 className="text-2xl font-bold mb-2">Verifying Email</h1>
                        <p className="text-muted-foreground">Please wait while we verify your email...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                        <h1 className="text-2xl font-bold mb-2 text-green-600">Email Verified!</h1>
                        <p className="text-muted-foreground mb-4">{message}</p>
                        <p className="text-sm text-muted-foreground">Redirecting you to the home page...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                        <h1 className="text-2xl font-bold mb-2 text-red-600">Verification Failed</h1>
                        <p className="text-muted-foreground mb-6">{message}</p>
                        <div className="space-y-2">
                            <Link href="/">
                                <Button className="w-full">
                                    Go to Home Page
                                </Button>
                            </Link>
                            <p className="text-sm text-muted-foreground">
                                Need help? Try signing in again from the home page.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
