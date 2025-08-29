"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Loader2, AlertCircle, Play, Calendar, Target } from "lucide-react"
import { SATDataService } from "@/lib/data-service"
import Link from "next/link"

interface OfficialExamSummary {
  examName: string // Base test name (e.g., "SAT Practice #1")
  modules: {
    moduleName: string // Full module name (e.g., "Bluebook - SAT Practice #1 - English - Module 1")
    subject: string
    module: string
    questionCount: number
  }[]
  totalQuestions: number
  totalMcq: number
  totalSpr: number
}

export default function OfficialExamsPage() {
  const [exams, setExams] = useState<OfficialExamSummary[]>([])
  const [filteredExams, setFilteredExams] = useState<OfficialExamSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadExams()
  }, [])

  useEffect(() => {
    filterExams()
  }, [exams, searchQuery])

  const loadExams = async () => {
    setLoading(true)
    setError(null)

    try {
      // Use the efficient exam summaries method (only loads metadata, not full question content)
      const response = await SATDataService.getOfficialPracticeExamSummaries()

      if (response.error) {
        setError(response.error)
        return
      }

      setExams(response.exams)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  const filterExams = () => {
    let filtered = exams

    if (searchQuery) {
      filtered = filtered.filter(exam =>
        exam.examName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredExams(filtered)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">OFFICIAL SAT PRACTICE</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Official SAT practice tests from the College Board's SAT Suite of Assessments
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="default" className="text-lg px-4 py-2">
              {exams.length} PRACTICE TESTS
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {exams.reduce((total, exam) => total + exam.totalQuestions, 0).toLocaleString()} TOTAL QUESTIONS
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              SAT SUITE OFFICIAL
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Practice Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search practice tests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading practice tests...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Error loading practice tests</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
              <Button variant="outline" onClick={loadExams} className="mt-4">
                <Target className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Exams Grid */}
        {!loading && !error && (
          <>
            {filteredExams.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No practice tests found matching your criteria.</p>
                  <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-4">
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {filteredExams.filter(exam => exam.modules.length > 0).map((exam) => (
                  <Card key={exam.examName} className="border-2 hover:border-primary transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{exam.examName}</CardTitle>
                      <CardDescription>
                        {exam.modules.length} modules • {exam.totalQuestions} questions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Module breakdown - Two columns: English left, Math right */}
                        <div className="grid grid-cols-2 gap-6">
                          {/* English modules */}
                          <div className="space-y-8">
                            <h4 className="text-sm font-semibold text-primary mb-4">English</h4>
                            {exam.modules
                              .filter((m) => m.subject === 'English')
                              .map((moduleInfo) => (
                                <div key={moduleInfo.moduleName} className="mb-2">
                                  <Link
                                    href={`/practice-tests/${encodeURIComponent(moduleInfo.moduleName)}`}
                                  >
                                    <Button variant="outline" size="sm" className="w-full justify-start p-4">
                                      <Play className="h-4 w-4 mr-2" />
                                      <div className="text-left">
                                        <div className="font-medium">{moduleInfo.module}</div>
                                        <div className="text-xs text-muted-foreground">{moduleInfo.questionCount} questions</div>
                                      </div>
                                    </Button>
                                  </Link>
                                </div>
                              ))}
                          </div>

                          {/* Math modules */}
                          <div className="space-y-8">
                            <h4 className="text-sm font-semibold text-primary mb-4">Math</h4>
                            {exam.modules
                              .filter((m) => m.subject === 'Math')
                              .map((moduleInfo) => (
                                <div key={moduleInfo.moduleName} className="mb-2">
                                  <Link
                                    href={`/practice-tests/${encodeURIComponent(moduleInfo.moduleName)}`}
                                  >
                                    <Button variant="outline" size="sm" className="w-full justify-start p-4">
                                      <Play className="h-4 w-4 mr-2" />
                                      <div className="text-left">
                                        <div className="font-medium">{moduleInfo.module}</div>
                                        <div className="text-xs text-muted-foreground">{moduleInfo.questionCount} questions</div>
                                      </div>
                                    </Button>
                                  </Link>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Take full test button */}
                        {exam.modules.length > 1 && (
                          <div className="pt-4 border-t">
                            <Link href={`/practice-tests/${encodeURIComponent(exam.examName)}?complete=true`}>
                              <Button className="w-full" size="lg">
                                <Play className="h-4 w-4 mr-2" />
                                Take Complete Test ({exam.totalQuestions} questions)
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}