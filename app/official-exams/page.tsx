"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Clock, Target, Trophy, Search, Loader2, AlertCircle, Play } from "lucide-react"
import { SATDataService } from "@/lib/data-service"
import Link from "next/link"

interface TestSummary {
  testName: string
  subject: string
  questionCount: number
  mcqCount: number
  sprCount: number
  testDate?: string
}

export default function OfficialExamsPage() {
  const [tests, setTests] = useState<TestSummary[]>([])
  const [filteredTests, setFilteredTests] = useState<TestSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("All")

  useEffect(() => {
    loadTests()
  }, [])

  useEffect(() => {
    filterTests()
  }, [tests, searchQuery, selectedSubject])

  const loadTests = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get all bluebook questions to group by test
      const response = await SATDataService.getBluebookQuestions({ limit: 10000 })

      if (response.error) {
        setError(response.error)
        return
      }

      // Group questions by test name and subject
      const testGroups: Record<string, TestSummary> = {}

      response.data.forEach(question => {
        const key = `${question.test_name}-${question.subject}`

        if (!testGroups[key]) {
          testGroups[key] = {
            testName: question.test_name,
            subject: question.subject,
            questionCount: 0,
            mcqCount: 0,
            sprCount: 0,
            testDate: question.test_date || undefined
          }
        }

        testGroups[key].questionCount++
        if (question.question_type === 'choice') {
          testGroups[key].mcqCount++
        } else {
          testGroups[key].sprCount++
        }
      })

      const testSummaries = Object.values(testGroups).sort((a, b) => {
        // Sort by test date (newest first) then by test name
        if (a.testDate && b.testDate) {
          return b.testDate.localeCompare(a.testDate)
        }
        return a.testName.localeCompare(b.testName)
      })

      setTests(testSummaries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tests')
    } finally {
      setLoading(false)
    }
  }

  const filterTests = () => {
    let filtered = tests

    if (searchQuery) {
      filtered = filtered.filter(test =>
        test.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedSubject !== "All") {
      filtered = filtered.filter(test => test.subject === selectedSubject)
    }

    setFilteredTests(filtered)
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

  const uniqueSubjects = [...new Set(tests.map(test => test.subject))]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">OFFICIAL PRACTICE TESTS</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Complete Bluebook digital SAT practice examinations
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="default" className="text-lg px-4 py-2">
              4,598 QUESTIONS
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              OFFICIAL BLUEBOOK FORMAT
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Subjects</SelectItem>
                  {uniqueSubjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
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
                <span className="font-semibold">Error loading tests</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
              <Button variant="outline" onClick={loadTests} className="mt-4">
                <Target className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tests Grid */}
        {!loading && !error && (
          <>
            {filteredTests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No tests found matching your criteria.</p>
                  <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedSubject("All") }} className="mt-4">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {filteredTests.map((test) => (
                  <Card key={`${test.testName}-${test.subject}`} className="border-2 hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg line-clamp-2">{test.testName}</CardTitle>
                        <Badge className={getSubjectColor(test.subject)}>{test.subject}</Badge>
                      </div>
                      <CardDescription>
                        {formatTestDate(test.testDate)} • Official Bluebook Format
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span>{test.questionCount} questions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span>{test.mcqCount} MCQ</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-primary" />
                            <span>{test.sprCount} SPR</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>~{Math.ceil(test.questionCount * 1.5)} min</span>
                          </div>
                        </div>

                        <Link href={`/practice-tests/${encodeURIComponent(test.testName)}`}>
                          <Button className="w-full" size="lg">
                            <Play className="h-4 w-4 mr-2" />
                            Start Practice Test
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Stats Summary */}
        {!loading && !error && filteredTests.length > 0 && (
          <Card className="mt-8 max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Practice Test Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {filteredTests.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Available Tests</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {filteredTests.reduce((sum, test) => sum + test.questionCount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Questions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {filteredTests.reduce((sum, test) => sum + test.mcqCount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Multiple Choice</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {filteredTests.reduce((sum, test) => sum + test.sprCount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Student Response</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  )
}