import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "Easy1600 - Free SAT Practice Tests & Question Bank",
  description:
    "Master the SAT with thousands of free practice questions from College Board, Princeton Review, and SAT Suite. Take full-length practice tests and improve your score.",
  keywords: "SAT prep, SAT practice test, SAT questions, College Board, Princeton Review, free SAT prep",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  )
}
