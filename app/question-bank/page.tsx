"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuestionCard } from "@/components/question-card"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Search, Filter, BookOpen, Target, Users, ArrowLeft, Loader2, AlertCircle, RefreshCw, BarChart3 } from "lucide-react"
import { SATDataService, QuestionFilters } from "@/lib/data-service"
import {
  mapCollegeBoardToEnhanced,
  mapPrincetonToEnhanced,
  getSourceDisplayName,
  getDifficultyColor,
  EnhancedQuestion
} from "@/lib/question-mappers"
import { TopicSelector, CompactTopicSelector, TopicFilters } from "@/components/topic-selector"
import { TopicAnalytics, TopicBreadcrumb } from "@/components/topic-analytics"

interface FilterOptions {
  difficulties: string[]
  modules: string[]
  primaryClasses: string[]
  skills: string[]
}

export default function QuestionBankPage() {
  // State for questions and loading
  const [satSuiteQuestions, setSatSuiteQuestions] = useState<EnhancedQuestion[]>([])
  const [princetonQuestions, setPrincetonQuestions] = useState<EnhancedQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All")
  const [selectedModule, setSelectedModule] = useState("All")
  const [selectedPrimaryClass, setSelectedPrimaryClass] = useState("All")
  const [selectedSkill, setSelectedSkill] = useState("All")
  const [selectedAnswerType, setSelectedAnswerType] = useState("All")
  const [topicFilters, setTopicFilters] = useState<TopicFilters>({ subjects: [], topics: [], subtopics: [] })
  const [showAnalytics, setShowAnalytics] = useState(false)

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const questionsPerPage = 20

  // State for filter options
  const [filterOptions, setFilterOptions] = useState<{
    satSuite: FilterOptions
    princeton: FilterOptions
  }>({
    satSuite: { difficulties: [], modules: [], primaryClasses: [], skills: [] },
    princeton: { difficulties: [], modules: [], primaryClasses: [], skills: [] }
  })

  // State for selected question and active tab
  const [selectedQuestion, setSelectedQuestion] = useState<EnhancedQuestion | null>(null)
  const [activeTab, setActiveTab] = useState("sat-suite")

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await SATDataService.getFilterOptions()
        setFilterOptions({
          satSuite: {
            difficulties: options.collegeboard.difficulties,
            modules: options.collegeboard.modules,
            primaryClasses: options.collegeboard.primaryClasses,
            skills: options.collegeboard.skills
          },
          princeton: {
            difficulties: options.princeton.difficulties,
            modules: options.princeton.modules,
            primaryClasses: options.princeton.primaryClasses,
            skills: options.princeton.skills
          }
        })
      } catch (err) {
        console.error('Failed to load filter options:', err)
      }
    }
    loadFilterOptions()
  }, [])

  // Load questions when tab changes or filters change
  useEffect(() => {
    loadQuestions()
  }, [activeTab, searchQuery, selectedDifficulty, selectedModule, selectedPrimaryClass, selectedSkill, selectedAnswerType, topicFilters, currentPage])

  const loadQuestions = async () => {
    setLoading(true)
    setError(null)

    try {
      const filters: QuestionFilters = {
        search: searchQuery || undefined,
        difficulty: selectedDifficulty !== "All" ? [selectedDifficulty] : undefined,
        module: selectedModule !== "All" ? [selectedModule] : undefined,
        primaryClass: selectedPrimaryClass !== "All" ? [selectedPrimaryClass] : undefined,
        skill: selectedSkill !== "All" ? [selectedSkill] : undefined,
        answerType: selectedAnswerType !== "All" ? [selectedAnswerType as 'mcq' | 'spr'] : undefined,
        topics: topicFilters.topics.length > 0 ? topicFilters.topics : undefined,
        subtopics: topicFilters.subtopics.length > 0 ? topicFilters.subtopics : undefined,
        limit: questionsPerPage,
        offset: (currentPage - 1) * questionsPerPage
      }

      if (activeTab === "sat-suite") {
        const response = await SATDataService.getCollegeBoardQuestions(filters)
        if (response.error) {
          setError(response.error)
        } else {
          const enhancedQuestions = response.data.map(mapCollegeBoardToEnhanced)
          setSatSuiteQuestions(enhancedQuestions)
          setTotalCount(response.count || 0)
        }
      } else {
        const response = await SATDataService.getPrincetonQuestions(filters)
        if (response.error) {
          setError(response.error)
        } else {
          const enhancedQuestions = response.data.map(mapPrincetonToEnhanced)
          setPrincetonQuestions(enhancedQuestions)
          setTotalCount(response.count || 0)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const currentQuestions = activeTab === "sat-suite" ? satSuiteQuestions : princetonQuestions
  const currentFilterOptions = activeTab === "sat-suite" ? filterOptions.satSuite : filterOptions.princeton

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedDifficulty("All")
    setSelectedModule("All")
    setSelectedPrimaryClass("All")
    setSelectedSkill("All")
    setSelectedAnswerType("All")
    setTopicFilters({ subjects: [], topics: [], subtopics: [] })
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalCount / questionsPerPage)

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
            Back to Question Bank
          </Button>
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
          <h1 className="text-4xl md:text-6xl font-bold mb-4">QUESTION BANK</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Practice with thousands of SAT questions from College Board and Princeton Review
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Badge variant="default" className="text-lg px-4 py-2">
              4,300+ QUESTIONS
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              100% FREE
            </Badge>
          </div>

          <div className="flex justify-center gap-2">
            <Button
              variant={showAnalytics ? "default" : "outline"}
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {showAnalytics ? "Hide" : "Show"} Analytics
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="sat-suite" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                College Board (3,290)
              </TabsTrigger>
              <TabsTrigger value="princeton" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Princeton Review (1,029)
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Analytics */}
          {showAnalytics && (
            <TopicAnalytics
              source={activeTab === "sat-suite" ? "collegeboard" : "princeton"}
              className="mb-6"
            />
          )}

          {/* Advanced Topic Filtering */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1">
              <TopicSelector
                source={activeTab === "sat-suite" ? "collegeboard" : "princeton"}
                filters={topicFilters}
                onFiltersChange={setTopicFilters}
              />
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Additional Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Answer Type */}
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

                    {/* Module */}
                    <Select value={selectedModule} onValueChange={setSelectedModule}>
                      <SelectTrigger>
                        <SelectValue placeholder="Module" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Modules</SelectItem>
                        {currentFilterOptions.modules.map(module => (
                          <SelectItem key={module} value={module}>{module}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Difficulty */}
                    <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Difficulties</SelectItem>
                        {currentFilterOptions.difficulties.map(diff => (
                          <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Primary Class (for Princeton) */}
                    {activeTab === "princeton" && (
                      <Select value={selectedPrimaryClass} onValueChange={setSelectedPrimaryClass}>
                        <SelectTrigger>
                          <SelectValue placeholder="Primary Class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Classes</SelectItem>
                          {currentFilterOptions.primaryClasses.map(cls => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Skill (for Princeton) */}
                    {activeTab === "princeton" && (
                      <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                        <SelectTrigger>
                          <SelectValue placeholder="Skill" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Skills</SelectItem>
                          {currentFilterOptions.skills.map(skill => (
                            <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Reset Filters */}
                    <Button variant="outline" onClick={resetFilters} className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Reset All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

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
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading questions...</span>
              </div>
            </div>
          )}

          {/* Questions */}
          {!loading && !error && (
            <>
              <TabsContent value="sat-suite">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">College Board Question Bank</h2>
                    <div className="text-sm text-muted-foreground">
                      {totalCount.toLocaleString()} questions total
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Official questions from the College Board's SAT question bank
                  </p>
                </div>

                {currentQuestions.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">No questions found matching your criteria.</p>
                      <Button variant="outline" onClick={resetFilters} className="mt-4">
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {currentQuestions.map((enhancedQuestion, index) => (
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
                            <Badge variant="secondary">
                              {enhancedQuestion.question.answer_type.toUpperCase()}
                            </Badge>
                          </div>
                          <CardDescription>
                            {getSourceDisplayName(enhancedQuestion.metadata.source)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm line-clamp-3 mb-4">
                            {enhancedQuestion.question.stem_text}
                          </p>
                          <div className="flex items-center justify-between">
                            <Button size="sm">
                              Practice Question
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {index + 1 + (currentPage - 1) * questionsPerPage} of {totalCount.toLocaleString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="princeton">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Princeton Review Questions</h2>
                    <div className="text-sm text-muted-foreground">
                      {totalCount.toLocaleString()} questions total
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Comprehensive SAT prep questions from Princeton Review with detailed explanations
                  </p>
                </div>

                {currentQuestions.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">No questions found matching your criteria.</p>
                      <Button variant="outline" onClick={resetFilters} className="mt-4">
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {currentQuestions.map((enhancedQuestion, index) => (
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
                            {getSourceDisplayName(enhancedQuestion.metadata.source)}
                            {enhancedQuestion.metadata.module && ` • ${enhancedQuestion.metadata.module}`}
                          </CardDescription>
                          {enhancedQuestion.metadata.topicInfo && (
                            <TopicBreadcrumb
                              subject={enhancedQuestion.metadata.topicInfo.subject}
                              topic={enhancedQuestion.metadata.topicInfo.topic}
                              subtopic={enhancedQuestion.metadata.topicInfo.subtopic}
                              source={enhancedQuestion.metadata.source}
                            />
                          )}
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm line-clamp-3 mb-4">
                            {enhancedQuestion.question.stem_text}
                          </p>
                          <div className="flex items-center justify-between">
                            <Button size="sm">
                              Practice Question
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {index + 1 + (currentPage - 1) * questionsPerPage} of {totalCount.toLocaleString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

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
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}