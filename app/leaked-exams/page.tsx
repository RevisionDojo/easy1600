"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Clock, Target, Trophy, Search, Loader2, AlertCircle, Play, Calendar } from "lucide-react"
import { SATDataService } from "@/lib/data-service"
import Link from "next/link"

interface ExamSummary {
  examName: string // Base exam name without subject
  testDate?: string
  subjects: {
    subject: string
    testName: string
    questionCount: number
  }[]
  totalQuestions: number
  totalMcq: number
  totalSpr: number
}

export default function LeakedExamsPage() {
  const [exams, setExams] = useState<ExamSummary[]>([])
  const [filteredExams, setFilteredExams] = useState<ExamSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedYear, setSelectedYear] = useState("All")

  useEffect(() => {
    loadExams()
  }, [])

  useEffect(() => {
    filterExams()
  }, [exams, searchQuery, selectedYear])

  const loadExams = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get all bluebook questions to group by exam
      const response = await SATDataService.getBluebookQuestions({ limit: 10000 })

      if (response.error) {
        setError(response.error)
        return
      }

      // Group questions by exam (removing subject from test name to group Math + English)
      const examGroups: Record<string, ExamSummary> = {}

      response.data.forEach(question => {
        // Extract base exam name by removing subject
        // e.g., "May 2024 US Form A" from "May 2024 US Form A - Math" or "May 2024 US Form A - English"
        let baseExamName = question.test_name

        // Remove subject suffixes if they exist
        baseExamName = baseExamName
          .replace(/ - Math$/i, '')
          .replace(/ - English$/i, '')
          .replace(/ Math$/i, '')
          .replace(/ English$/i, '')

        if (!examGroups[baseExamName]) {
          examGroups[baseExamName] = {
            examName: baseExamName,
            testDate: question.test_date || undefined,
            subjects: [],
            totalQuestions: 0,
            totalMcq: 0,
            totalSpr: 0
          }
        }

        const exam = examGroups[baseExamName]

        // Find or create subject entry
        let subjectEntry = exam.subjects.find(s => s.subject === question.subject)
        if (!subjectEntry) {
          subjectEntry = {
            subject: question.subject,
            testName: question.test_name,
            questionCount: 0
          }
          exam.subjects.push(subjectEntry)
        }

        // Update counts
        subjectEntry.questionCount++
        exam.totalQuestions++
      })

      const examSummaries = Object.values(examGroups)
        .sort((a, b) => {
          // Sort by test date (newest first) then by exam name
          if (a.testDate && b.testDate) {
            return b.testDate.localeCompare(a.testDate)
          }
          return a.examName.localeCompare(b.examName)
        })
        .filter(exam => exam.subjects.length > 0) // Only include exams with questions
        .map(exam => ({
          ...exam,
          // Sort subjects to ensure English comes before Math
          subjects: exam.subjects.sort((a, b) => {
            if (a.subject.toLowerCase() === 'english' && b.subject.toLowerCase() === 'math') return -1
            if (a.subject.toLowerCase() === 'math' && b.subject.toLowerCase() === 'english') return 1
            return a.subject.localeCompare(b.subject)
          })
        }))

      setExams(examSummaries)
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
        exam.examName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.subjects.some(subject =>
          subject.subject.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    if (selectedYear !== "All") {
      filtered = filtered.filter(exam =>
        exam.testDate?.includes(selectedYear) ||
        exam.examName.includes(selectedYear)
      )
    }

    setFilteredExams(filtered)
  }

  const formatTestDate = (dateString?: string) => {
    if (!dateString) return 'Unknown Date'

    // Handle YYYY.MM format
    if (dateString.includes('.')) {
      const [year, month] = dateString.split('.')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${monthNames[parseInt(month) - 1]} ${year}`
    }

    return dateString
  }

  const getSubjectColor = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'english':
        return 'bg-blue-100 text-blue-800'
      case 'math':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Extract years for filtering
  const availableYears = [...new Set(exams.map(exam => {
    if (exam.testDate?.includes('.')) {
      return exam.testDate.split('.')[0]
    }
    // Try to extract year from exam name
    const yearMatch = exam.examName.match(/20\d{2}/)
    return yearMatch ? yearMatch[0] : null
  }).filter(Boolean))].sort((a, b) => b!.localeCompare(a!))

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">LEAKED SAT EXAMS</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Complete Bluebook digital SAT examinations (leaked tests)
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="default" className="text-lg px-4 py-2">
              {exams.length} COMPLETE EXAMS
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              4,598 TOTAL QUESTIONS
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              LEAKED BLUEBOOK FORMAT
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year!}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading leaked exams...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Error loading exams</span>
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
                  <p className="text-muted-foreground">No exams found matching your criteria.</p>
                  <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedYear("All") }} className="mt-4">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {filteredExams.map((exam) => (
                  <Card key={exam.examName} className="border-2 hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg line-clamp-2">{exam.examName}</CardTitle>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">{formatTestDate(exam.testDate)}</span>
                        </div>
                      </div>
                      <CardDescription>
                        {exam.subjects.length} sections
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Subject breakdown */}
                        <div className="space-y-2">
                          {exam.subjects.map((subject) => (
                            <div key={subject.subject} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <div className="flex items-center gap-2">
                                <Badge className={getSubjectColor(subject.subject)} variant="secondary">
                                  {subject.subject}
                                </Badge>
                              </div>
                              <div className="text-right text-sm">
                                <div className="font-medium">{subject.questionCount} questions</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          {exam.subjects.map((subject) => (
                            <Link
                              key={subject.subject}
                              href={`/practice-tests/${encodeURIComponent(subject.testName)}?subject=${encodeURIComponent(subject.subject)}`}
                            >
                              <Button variant="outline" size="sm" className="w-full">
                                <Play className="h-4 w-4 mr-2" />
                                {subject.subject}
                              </Button>
                            </Link>
                          ))}
                        </div>

                        {/* Take full exam button */}
                        {exam.subjects.length === 2 && (
                          <div className="pt-2">
                            <Link href={`/practice-tests/${encodeURIComponent(exam.examName)}?complete=true`}>
                              <Button className="w-full" size="lg">
                                <Play className="h-4 w-4 mr-2" />
                                Take Complete Exam
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