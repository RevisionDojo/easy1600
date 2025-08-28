'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, CheckCircle } from 'lucide-react'
import { authHelpers } from '@/lib/supabase'

interface AuthPopupProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

type AuthStep = 'signin' | 'signup' | 'verification'

export const AuthPopup: React.FC<AuthPopupProps> = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState<AuthStep>('signin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const resetForm = () => {
        setEmail('')
        setPassword('')
        setError('')
        setMessage('')
        setLoading(false)
        setStep('signin')
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { data, error } = await authHelpers.signIn(email, password)

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        if (data.user && !data.user.email_confirmed_at) {
            setStep('verification')
            setMessage('Please check your email and click the verification link to complete sign in.')
            setLoading(false)
            return
        }

        // Success - user is signed in
        setLoading(false)
        onSuccess?.()
        handleClose()
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (password.length < 6) {
            setError('Password must be at least 6 characters long')
            setLoading(false)
            return
        }

        const { data, error } = await authHelpers.signUp(email, password)

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        // Show verification step
        setStep('verification')
        setMessage('Please check your email and click the verification link to complete your account setup.')
        setLoading(false)
    }

    const handleResendVerification = async () => {
        setLoading(true)
        setError('')

        const { error } = await authHelpers.resendVerification(email)

        if (error) {
            setError(error.message)
        } else {
            setMessage('Verification email sent! Please check your inbox.')
        }

        setLoading(false)
    }

    const renderSignInForm = () => (
        <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                    />
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
            </Button>

            <div className="text-center">
                <Button
                    type="button"
                    variant="link"
                    onClick={() => setStep('signup')}
                    className="text-sm"
                >
                    Don't have an account? Sign up
                </Button>
            </div>
        </form>
    )

    const renderSignUpForm = () => (
        <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="password"
                        type="password"
                        placeholder="Create a password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                    />
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
            </Button>

            <div className="text-center">
                <Button
                    type="button"
                    variant="link"
                    onClick={() => setStep('signin')}
                    className="text-sm"
                >
                    Already have an account? Sign in
                </Button>
            </div>
        </form>
    )

    const renderVerificationStep = () => (
        <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Check Your Email</h3>

            {message && (
                <Alert>
                    <AlertDescription>{message}</AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                    We sent a verification link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                    Click the link in your email to complete the process.
                </p>
            </div>

            <div className="space-y-2">
                <Button
                    onClick={handleResendVerification}
                    variant="outline"
                    disabled={loading}
                    className="w-full"
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Resend Verification Email
                </Button>

                <Button
                    onClick={() => setStep('signin')}
                    variant="link"
                    className="w-full text-sm"
                >
                    Back to Sign In
                </Button>
            </div>
        </div>
    )

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'signin' && 'Sign In to Easy1600'}
                        {step === 'signup' && 'Create Your Account'}
                        {step === 'verification' && 'Verify Your Email'}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {step === 'signin' && renderSignInForm()}
                    {step === 'signup' && renderSignUpForm()}
                    {step === 'verification' && renderVerificationStep()}
                </div>
            </DialogContent>
        </Dialog>
    )
}
