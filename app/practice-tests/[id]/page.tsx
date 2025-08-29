"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { QuestionCard } from "@/components/question-card"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Clock, ArrowLeft, ArrowRight, Flag, CheckCircle, Target, Loader2, AlertCircle, Play, Pause } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { SATDataService } from "@/lib/data-service"
import { mapBluebookToEnhanced, EnhancedQuestion } from "@/lib/question-mappers"

interface TestSession {
  testName: string
  questions: EnhancedQuestion[]
  currentQuestionIndex: number
  answers: Record<string, string | null>
  startTime: number
  timeSpent: number
  isCompleted: boolean
  isPaused: boolean
}

export default function PracticeTestPage() {
  const params = useParams()
  const testName = decodeURIComponent(params.id as string)

  const [session, setSession] = useState<TestSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    loadTest()
  }, [testName])

  useEffect(() => {
    if (!session || session.isCompleted || session.isPaused) return

    const timer = setInterval(() => {
      setSession(prev => prev ? {
        ...prev,
        timeSpent: Date.now() - prev.startTime
      } : null)
    }, 1000)

    return () => clearInterval(timer)
  }, [session?.isPaused, session?.isCompleted])

  const loadTest = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await SATDataService.getBluebookTestById(testName)

      if (response.error) {
        setError(response.error)
        return
      }

      if (response.data.length === 0) {
        setError('Test not found')
        return
      }

      const enhancedQuestions = response.data.map(mapBluebookToEnhanced)

      setSession({
        testName,
        questions: enhancedQuestions,
        currentQuestionIndex: 0,
        answers: {},
        startTime: Date.now(),
        timeSpent: 0,
        isCompleted: false,
        isPaused: false
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (answer: any, isCorrect: boolean) => {
    if (!session) return

    const questionId = session.questions[session.currentQuestionIndex].metadata.id
    setSession(prev => prev ? {
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: typeof answer === 'object' ? answer.letter : answer
      }
    } : null)
  }

  const goToNextQuestion = () => {
    if (!session) return

    if (session.currentQuestionIndex < session.questions.length - 1) {
      setSession(prev => prev ? {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      } : null)
    } else {
      // Test completed
      setSession(prev => prev ? {
        ...prev,
        isCompleted: true
      } : null)
      setShowResults(true)
    }
  }

  const goToPreviousQuestion = () => {
    if (!session || session.currentQuestionIndex === 0) return

    setSession(prev => prev ? {
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex - 1
    } : null)
  }

  const togglePause = () => {
    if (!session) return

    setSession(prev => prev ? {
      ...prev,
      isPaused: !prev.isPaused,
      startTime: !prev.isPaused ? prev.startTime : Date.now() - prev.timeSpent
    } : null)
  }

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const calculateScore = () => {
    if (!session) return { correct: 0, total: 0, percentage: 0 }

    let correct = 0
    const total = session.questions.length

    session.questions.forEach(question => {
      const questionId = question.metadata.id
      const userAnswer = session.answers[questionId]

      if (question.format === 'bluebook') {
        const bluebookQ = question.question as any
        if (userAnswer === bluebookQ.correct) {
          correct++
        }
      }
    })

    return {
      correct,
      total,
      percentage: Math.round((correct / total) * 100)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading practice test...</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive mb-4">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Error loading test</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2">
                <Link href="/official-exams">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Tests
                  </Button>
                </Link>
                <Button onClick={loadTest}>
                  <Target className="h-4 w-4 mr-2" />
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

  if (!session) {
    return null
  }

  // Results view
  if (showResults) {
    const score = calculateScore()
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Test Complete! 🎉</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">
                    {score.percentage}%
                  </div>
                  <div className="text-muted-foreground">
                    {score.correct} out of {score.total} questions correct
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <div>Test: {session.testName}</div>
                  <div>Time: {formatTime(session.timeSpent)}</div>
                </div>

                <div className="flex gap-2 justify-center">
                  <Link href="/official-exams">
                    <Button variant="outline">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Tests
                    </Button>
                  </Link>
                  <Button onClick={loadTest}>
                    <Play className="h-4 w-4 mr-2" />
                    Retake Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  const currentQuestion = session.questions[session.currentQuestionIndex]
  const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Test Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/official-exams">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Exit Test
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{session.testName}</h1>
                <p className="text-sm text-muted-foreground">
                  Question {session.currentQuestionIndex + 1} of {session.questions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-mono">
                  {formatTime(session.timeSpent)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={togglePause}
              >
                {session.isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
            </div>
          </div>

          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        {session.isPaused ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6 text-center">
              <div className="text-6xl mb-4">⏸️</div>
              <h2 className="text-xl font-semibold mb-2">Test Paused</h2>
              <p className="text-muted-foreground mb-6">
                Take a break! Click Resume when you're ready to continue.
              </p>
              <Button onClick={togglePause}>
                <Play className="h-4 w-4 mr-2" />
                Resume Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-4xl mx-auto">
            <QuestionCard
              data={currentQuestion.question}
              format={currentQuestion.format}
              showExplanation={false}
              onAnswer={handleAnswer}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={goToPreviousQuestion}
                disabled={session.currentQuestionIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {Object.keys(session.answers).length} of {session.questions.length} answered
                </span>
              </div>

              <Button onClick={goToNextQuestion}>
                {session.currentQuestionIndex === session.questions.length - 1 ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finish Test
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}