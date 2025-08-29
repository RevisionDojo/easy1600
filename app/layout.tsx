import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "@/contexts/auth-context"
import { PostHogProvider } from "@/components/posthog-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Easy1600 - Free SAT Practice Tests & Question Bank",
  description:
    "Master the SAT with thousands of free practice questions from College Board, Princeton Review, and SAT Suite. Take full-length practice tests and improve your score.",
  keywords: "SAT prep, SAT practice test, SAT questions, College Board, Princeton Review, free SAT prep",
  generator: "v0.app",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>😈</text></svg>",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} min-h-screen flex flex-col`}>
        <PostHogProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
