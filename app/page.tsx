import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Target, Users, Zap } from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <section className="flex-1 px-4 py-12">
        <div className="container mx-auto max-w-5xl">
          {/* Main heading */}
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-balance mb-6">
              EVERY OFFICIAL
              <span className="text-primary block"> SAT QUESTION</span>
            </h1>
            <div className="flex items-center justify-center gap-4 mb-6">
              <p className="text-2xl md:text-3xl font-semibold text-muted-foreground">LEAKED AND PRACTICE</p>
              <Badge variant="default" className="text-lg px-4 py-2">
                100% FREE
              </Badge>
            </div>
          </div>

          {/* Card grid - 2 rows: 2 cards centered on top, 3 cards on bottom */}
          {/* Top row - 2 highlighted cards centered */}
          <div className="mb-12 max-w-6xl mx-auto">
            <div className="flex justify-center gap-6 mb-6">
              <Link href="/leaked-exams" className="block w-full max-w-xs">
                <div className="bg-primary text-primary-foreground p-6 rounded-lg text-center hover:scale-105 transition-transform duration-200 cursor-pointer h-full">
                  <BookOpen className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Official August 2025 SAT Exam</h3>
                  <p className="text-sm opacity-90">Latest official questions</p>
                </div>
              </Link>
              <Link href="/leaked-exams" className="block w-full max-w-xs">
                <div className="bg-primary text-primary-foreground p-6 rounded-lg text-center hover:scale-105 transition-transform duration-200 cursor-pointer h-full">
                  <Target className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">All Leaked SAT Exams</h3>
                  <p className="text-sm opacity-90">Complete collection</p>
                </div>
              </Link>
            </div>

            {/* Bottom row - 3 cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/question-bank" className="block">
                <div className="bg-card border-2 border-primary p-6 rounded-lg text-center hover:scale-105 hover:border-primary/80 transition-all duration-200 cursor-pointer h-full">
                  <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">SAT Suite Question Bank</h3>
                  <p className="text-sm text-muted-foreground">Official College Board</p>
                </div>
              </Link>

              <Link href="/official-exams" className="block">
                <div className="bg-card border-2 border-primary p-6 rounded-lg text-center hover:scale-105 hover:border-primary/80 transition-all duration-200 cursor-pointer h-full">
                  <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">ALL Official Practice Tests</h3>
                  <p className="text-sm text-muted-foreground">Full-length exams</p>
                </div>
              </Link>

              <Link href="/question-bank" className="block">
                <div className="bg-card border-2 border-primary p-6 rounded-lg text-center hover:scale-105 hover:border-primary/80 transition-all duration-200 cursor-pointer h-full">
                  <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Princeton Review Question Bank</h3>
                  <p className="text-sm text-muted-foreground">Premium prep materials</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/practice-tests">
              <Button size="lg" className="text-xl px-12 py-4 w-full sm:w-auto">
                Browse Tests
              </Button>
            </Link>
            <Link href="/question-bank">
              <Button
                variant="outline"
                size="lg"
                className="text-xl px-12 py-4 w-full sm:w-auto border-2 border-primary bg-transparent"
              >
                Browse Questions
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
