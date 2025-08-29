"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, Eye, Search, Loader2, AlertCircle, Target, BookOpen, ArrowLeft } from "lucide-react"
import { SATDataService, QuestionFilters } from "@/lib/data-service"
import { mapCollegeBoardToEnhanced, EnhancedQuestion, getDifficultyColor } from "@/lib/question-mappers"
import { QuestionCard } from "@/components/question-card"

export default function LeakedExamsPage() {
  const [questions, setQuestions] = useState<EnhancedQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All")
  const [selectedModule, setSelectedModule] = useState("All")
  const [selectedAnswerType, setSelectedAnswerType] = useState("All")
  const [selectedQuestion, setSelectedQuestion] = useState<EnhancedQuestion | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filterOptions, setFilterOptions] = useState({
    difficulties: [] as string[],
    modules: [] as string[]
  })

  const questionsPerPage = 24

  useEffect(() => {
    loadFilterOptions()
  }, [])

  useEffect(() => {
    loadQuestions()
  }, [searchQuery, selectedDifficulty, selectedModule, selectedAnswerType, currentPage])

  const loadFilterOptions = async () => {
    try {
      const options = await SATDataService.getFilterOptions()
      setFilterOptions({
        difficulties: options.collegeboard.difficulties,
        modules: options.collegeboard.modules
      })
    } catch (err) {
      console.error('Failed to load filter options:', err)
    }
  }

  const loadQuestions = async () => {
    setLoading(true)
    setError(null)

    try {
      const filters: QuestionFilters = {
        search: searchQuery || undefined,
        difficulty: selectedDifficulty !== "All" ? [selectedDifficulty] : undefined,
        module: selectedModule !== "All" ? [selectedModule] : undefined,
        answerType: selectedAnswerType !== "All" ? [selectedAnswerType as 'mcq' | 'spr'] : undefined,
        limit: questionsPerPage,
        offset: (currentPage - 1) * questionsPerPage
      }

      const response = await SATDataService.getCollegeBoardQuestions(filters)

      if (response.error) {
        setError(response.error)
      } else {
        const enhancedQuestions = response.data.map(mapCollegeBoardToEnhanced)
        setQuestions(enhancedQuestions)
        setTotalCount(response.count || 0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedDifficulty("All")
    setSelectedModule("All")
    setSelectedAnswerType("All")
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalCount / questionsPerPage)

  // Individual question view
  if (selectedQuestion) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => setSelectedQuestion(null)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leaked Exams
          </Button>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">College Board</Badge>
              {selectedQuestion.metadata.difficulty && (
                <Badge className={getDifficultyColor(selectedQuestion.metadata.difficulty)}>
                  {selectedQuestion.metadata.difficulty}
                </Badge>
              )}
              {selectedQuestion.metadata.module && (
                <Badge variant="secondary">{selectedQuestion.metadata.module}</Badge>
              )}
            </div>
            <h2 className="text-xl font-semibold">Question {selectedQuestion.question.question_id}</h2>
          </div>

          <QuestionCard
            data={selectedQuestion.question}
            format={selectedQuestion.format}
            showExplanation={true}
          />
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">LEAKED SAT EXAMS</h1>
          <p className="text-xl text-muted-foreground mb-6">
            College Board SAT Suite question bank - Practice with real exam questions
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="default" className="text-lg px-4 py-2">
              3,290 QUESTIONS
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              COLLEGE BOARD OFFICIAL
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedAnswerType} onValueChange={setSelectedAnswerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Answer Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                  <SelectItem value="spr">Student Response</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Modules</SelectItem>
                  {filterOptions.modules.map(module => (
                    <SelectItem key={module} value={module}>{module}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Difficulties</SelectItem>
                  {filterOptions.difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading questions...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Error loading questions</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
              <Button variant="outline" onClick={loadQuestions} className="mt-4">
                <Target className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Questions Grid */}
        {!loading && !error && (
          <>
            {questions.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No questions found matching your criteria.</p>
                  <Button variant="outline" onClick={resetFilters} className="mt-4">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="mb-4 text-sm text-muted-foreground text-center">
                  Showing {((currentPage - 1) * questionsPerPage) + 1}-{Math.min(currentPage * questionsPerPage, totalCount)} of {totalCount.toLocaleString()} questions
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {questions.map((enhancedQuestion, index) => (
                    <Card
                      key={enhancedQuestion.metadata.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedQuestion(enhancedQuestion)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Question {enhancedQuestion.question.question_id}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="secondary">
                              {enhancedQuestion.question.answer_type.toUpperCase()}
                            </Badge>
                            {enhancedQuestion.metadata.difficulty && (
                              <Badge className={getDifficultyColor(enhancedQuestion.metadata.difficulty)}>
                                {enhancedQuestion.metadata.difficulty}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription>
                          College Board SAT Suite
                          {enhancedQuestion.metadata.module && ` • ${enhancedQuestion.metadata.module}`}
                          {enhancedQuestion.metadata.skill && ` • ${enhancedQuestion.metadata.skill}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm line-clamp-3 mb-4">
                          {enhancedQuestion.question.stem_text}
                        </p>
                        <div className="flex items-center justify-between">
                          <Button size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Question
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            #{index + 1 + (currentPage - 1) * questionsPerPage}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, currentPage - 2) + i
                        if (pageNum > totalPages) return null

                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Stats Summary */}
        {!loading && !error && questions.length > 0 && (
          <Card className="mt-8 max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>College Board Question Bank Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {totalCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Questions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {questions.filter(q => q.question.answer_type === 'mcq').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Multiple Choice (Current Page)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {questions.filter(q => q.question.answer_type === 'spr').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Student Response (Current Page)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {filterOptions.modules.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Available Modules</div>
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