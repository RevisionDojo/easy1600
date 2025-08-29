"use client"

import { useState, useEffect, useMemo } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QuestionCard } from "@/components/question-card"
import { Search, Loader2, AlertCircle, BookOpen, Filter, ArrowLeft } from "lucide-react"
import { SATDataService } from "@/lib/data-service"
import { mapBluebookToEnhanced, EnhancedQuestion } from "@/lib/question-mappers"
import Link from "next/link"

export default function BrowseQuestionsPage() {
    const [questions, setQuestions] = useState<EnhancedQuestion[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 })
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedSubject, setSelectedSubject] = useState("All")
    const [selectedQuestionType, setSelectedQuestionType] = useState("All")
    const [currentPage, setCurrentPage] = useState(1)
    const questionsPerPage = 20

    useEffect(() => {
        loadQuestions()
    }, [])

    const loadQuestions = async () => {
        setLoading(true)
        setError(null)

        try {
            // Load all bluebook questions in batches (Supabase has 1000 row limit)
            const allQuestions: any[] = []
            let offset = 0
            const batchSize = 1000
            let hasMore = true

            while (hasMore) {
                const response = await SATDataService.getBluebookQuestions({
                    limit: batchSize,
                    offset: offset
                })

                if (response.error) {
                    setError(response.error)
                    return
                }

                allQuestions.push(...response.data)

                // Update progress
                setLoadingProgress({
                    current: allQuestions.length,
                    total: response.count || allQuestions.length
                })

                // Check if we got fewer results than the batch size (means we're at the end)
                hasMore = response.data.length === batchSize
                offset += batchSize

                // Optional: Add a small delay to prevent overwhelming the server
                if (hasMore) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                }
            }

            // Convert to enhanced format
            const enhancedQuestions = allQuestions.map(mapBluebookToEnhanced)
            setQuestions(enhancedQuestions)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load questions')
        } finally {
            setLoading(false)
        }
    }

    // Filter questions based on search and filters
    const filteredQuestions = useMemo(() => {
        let filtered = questions

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(q => {
                const question = q.question as any
                const searchableText = [
                    question.article || '',
                    question.question || '',
                    question.solution || ''
                ].join(' ').toLowerCase()

                return searchableText.includes(query)
            })
        }

        // Filter by subject
        if (selectedSubject !== "All") {
            filtered = filtered.filter(q => {
                const originalQuestion = questions.find(orig => orig.metadata.id === q.metadata.id)
                return originalQuestion?.metadata.subject === selectedSubject
            })
        }

        // Filter by question type
        if (selectedQuestionType !== "All") {
            filtered = filtered.filter(q => {
                const question = q.question as any
                const questionType = question.type === 'choice' ? 'Multiple Choice' : 'Student Response'
                return questionType === selectedQuestionType
            })
        }

        return filtered
    }, [questions, searchQuery, selectedSubject, selectedQuestionType])

    // Paginate results
    const paginatedQuestions = useMemo(() => {
        const startIndex = (currentPage - 1) * questionsPerPage
        const endIndex = startIndex + questionsPerPage
        return filteredQuestions.slice(startIndex, endIndex)
    }, [filteredQuestions, currentPage])

    const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage)

    // Get unique subjects for filter
    const availableSubjects = useMemo(() => {
        const subjects = new Set(questions.map(q => q.metadata.subject))
        return Array.from(subjects).sort()
    }, [questions])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, selectedSubject, selectedQuestionType])

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-4 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <div className="text-center">
                                <div className="font-medium">Loading questions...</div>
                                {loadingProgress.total > 0 && (
                                    <div className="text-sm mt-2">
                                        Loaded {loadingProgress.current.toLocaleString()} of {loadingProgress.total.toLocaleString()} questions
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="container mx-auto px-4 py-8">
                    <Card className="max-w-2xl mx-auto border-destructive">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-destructive mb-4">
                                <AlertCircle className="h-5 w-5" />
                                <span className="font-semibold">Error loading questions</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">{error}</p>
                            <div className="flex gap-2">
                                <Link href="/">
                                    <Button variant="outline">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Home
                                    </Button>
                                </Link>
                                <Button onClick={loadQuestions}>
                                    Retry
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Home
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Browse Questions</h1>
                            <p className="text-muted-foreground">
                                Search through all leaked SAT exam questions
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{questions.length} total questions</span>
                        </div>
                        {filteredQuestions.length !== questions.length && (
                            <div className="flex items-center gap-1">
                                <Filter className="h-4 w-4" />
                                <span>{filteredQuestions.length} matching filters</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search and Filters */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Search & Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search bar */}
                            <div className="flex-1">
                                <Input
                                    placeholder="Search question content, articles, or explanations..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex gap-4">
                                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Subjects</SelectItem>
                                        {availableSubjects.map(subject => (
                                            <SelectItem key={subject} value={subject}>
                                                {subject}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={selectedQuestionType} onValueChange={setSelectedQuestionType}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Types</SelectItem>
                                        <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                                        <SelectItem value="Student Response">Student Response</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                {filteredQuestions.length === 0 ? (
                    <Card className="max-w-2xl mx-auto">
                        <CardContent className="pt-6 text-center">
                            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No questions found</h3>
                            <p className="text-muted-foreground mb-4">
                                Try adjusting your search terms or filters
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchQuery("")
                                    setSelectedSubject("All")
                                    setSelectedQuestionType("All")
                                }}
                            >
                                Clear all filters
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Questions List */}
                        <div className="space-y-6">
                            {paginatedQuestions.map((question, index) => {
                                const questionNumber = (currentPage - 1) * questionsPerPage + index + 1
                                return (
                                    <div key={question.metadata.id} className="relative">
                                        {/* Question metadata */}
                                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                                            <Badge variant="outline" className="text-xs">
                                                #{questionNumber}
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                                {question.metadata.subject}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {question.metadata.testName}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {(question.question as any).type === 'choice' ? 'Multiple Choice' : 'Student Response'}
                                            </Badge>
                                        </div>

                                        {/* Question Card */}
                                        <QuestionCard
                                            data={question.question}
                                            format={question.format}
                                            showExplanation={true}
                                            questionNumber={questionNumber}
                                            isPracticeMode={false}
                                        />
                                    </div>
                                )
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = currentPage <= 3
                                            ? i + 1
                                            : currentPage >= totalPages - 2
                                                ? totalPages - 4 + i
                                                : currentPage - 2 + i

                                        if (pageNum < 1 || pageNum > totalPages) return null

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={pageNum === currentPage ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className="w-10"
                                            >
                                                {pageNum}
                                            </Button>
                                        )
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>

                                <div className="text-sm text-muted-foreground ml-4">
                                    Page {currentPage} of {totalPages} ({filteredQuestions.length} questions)
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Footer />
        </div>
    )
}
