"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QuestionCard } from "@/components/question-card"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Clock, ArrowLeft, ArrowRight, Flag, CheckCircle, Target, Loader2, AlertCircle, Play, Pause, BookOpen, Grid3X3 } from "lucide-react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { SATDataService } from "@/lib/data-service"
import { mapBluebookToEnhanced, mapOfficialPracticeToEnhanced, EnhancedQuestion } from "@/lib/question-mappers"

interface ModuleSection {
  subject: string
  module: string
  questions: EnhancedQuestion[]
  startIndex: number // Global index where this module starts
  answers: Record<string, string | null>
  flagged: Record<string, boolean> // Track flagged questions
  isCompleted: boolean
}

interface TestSession {
  testName: string
  isCompleteExam: boolean
  modules: ModuleSection[]
  currentModuleIndex: number
  currentQuestionIndex: number // Index within current module
  globalQuestionIndex: number // Global index across all modules
  totalQuestions: number
  startTime: number
  timeSpent: number
  isCompleted: boolean
  isPaused: boolean
}

export default function PracticeTestPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const testName = decodeURIComponent(params.id as string)
  const subject = searchParams.get('subject')
  const isCompleteExam = searchParams.get('complete') === 'true'
  const source = searchParams.get('source')

  const [session, setSession] = useState<TestSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [selectedResultQuestion, setSelectedResultQuestion] = useState<{
    moduleIndex: number
    questionIndex: number
    question: EnhancedQuestion
    userAnswer: string | null
    status: 'correct' | 'incorrect' | 'not-answered'
  } | null>(null)

  useEffect(() => {
    loadTest()
  }, [testName, subject, isCompleteExam])

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
      let response
      let displayName = testName
      let isOfficialPractice = false

      // Check if this is explicitly an official practice test
      if (source === 'official') {
        isOfficialPractice = true
        if (isCompleteExam) {
          response = await SATDataService.getOfficialPracticeCompleteExam(testName)
          displayName = `${testName} (Complete Exam)`
        } else {
          response = await SATDataService.getOfficialPracticeExamById(testName)
          displayName = `${testName} (Official Practice)`
        }
      } else if (isCompleteExam) {
        // Load complete exam (both subjects) - try Bluebook first
        response = await SATDataService.getBluebookCompleteExam(testName)
        displayName = `${testName} (Complete Exam)`
      } else if (subject) {
        // Load specific subject only
        response = await SATDataService.getBluebookTestById(testName, subject)
        displayName = `${testName} - ${subject}`
      } else {
        // Try Bluebook first
        response = await SATDataService.getBluebookTestById(testName)

        // If no Bluebook test found, try Official Practice
        if (!response.error && response.data.length === 0) {
          // Check if this is a complete test request
          const isCompleteOfficialTest = searchParams.get('complete') === 'true'

          if (isCompleteOfficialTest) {
            response = await SATDataService.getOfficialPracticeCompleteExam(testName)
          } else {
            response = await SATDataService.getOfficialPracticeExamById(testName)
          }

          isOfficialPractice = true
          displayName = `${testName} (Official Practice)`
        }
      }

      if (response.error) {
        setError(response.error)
        return
      }

      if (response.data.length === 0) {
        setError('Test not found')
        return
      }

      const enhancedQuestions = isOfficialPractice
        ? (response.data as any[]).map(mapOfficialPracticeToEnhanced)
        : (response.data as any[]).map(mapBluebookToEnhanced)

      // Group questions by subject and module
      const moduleGroups: Record<string, EnhancedQuestion[]> = {}

      if (isOfficialPractice) {
        // For official practice tests, group by exam_name (which contains module info)
        enhancedQuestions.forEach(question => {
          const originalQuestion = response.data.find(q => (q as any).question_id === (question.question as any).question_id) as any
          if (originalQuestion && originalQuestion.exam_name) {
            const examName = originalQuestion.exam_name
            const key = examName // Use full exam name as key

            if (!moduleGroups[key]) {
              moduleGroups[key] = []
            }
            moduleGroups[key].push(question)
          }
        })
      } else {
        // For Bluebook tests, group by subject and module
        enhancedQuestions.forEach(question => {
          const originalQuestion = response.data.find(q => q.id === question.metadata.id) as any
          if (originalQuestion) {
            const subject = originalQuestion.subject
            const module = originalQuestion.module || 'module1'
            const key = `${subject}-${module}`

            if (!moduleGroups[key]) {
              moduleGroups[key] = []
            }
            moduleGroups[key].push(question)
          }
        })
      }

      // Create ordered modules based on the test type
      const modules: ModuleSection[] = []
      let globalIndex = 0

      if (isOfficialPractice) {
        // For official practice tests, create modules from grouped exam names
        Object.entries(moduleGroups).forEach(([examName, questions]) => {
          // Parse the exam name to get subject and module info
          const name = examName.toLowerCase()
          let subject = 'Unknown'
          let module = 'Module 1' // Default to Module 1

          if (name.includes('english')) {
            subject = 'English'
          } else if (name.includes('math')) {
            subject = 'Math'
          }

          if (name.includes('module 1')) {
            module = 'Module 1'
          } else if (name.includes('module 2')) {
            if (name.includes('easy')) {
              module = 'Module 2 (Easy)'
            } else if (name.includes('hard')) {
              module = 'Module 2 (Hard)'
            } else {
              module = 'Module 2'
            }
          }

          modules.push({
            subject,
            module,
            questions: questions,
            startIndex: globalIndex,
            answers: {},
            flagged: {},
            isCompleted: false
          })
          globalIndex += questions.length
        })

        // Sort modules: English first, then Math, then by module number
        modules.sort((a, b) => {
          if (a.subject !== b.subject) {
            return a.subject === 'English' ? -1 : 1
          }
          return a.module.localeCompare(b.module)
        })
      } else if (isCompleteExam) {
        // Complete exam order: English M1 → English M2 → Math M1 → Math M2
        const subjectOrder = ['English', 'Math']
        const moduleOrder = ['module1', 'module2']

        subjectOrder.forEach(subj => {
          moduleOrder.forEach(mod => {
            const key = `${subj}-${mod}`
            if (moduleGroups[key] && moduleGroups[key].length > 0) {
              modules.push({
                subject: subj,
                module: mod,
                questions: moduleGroups[key],
                startIndex: globalIndex,
                answers: {},
                flagged: {},
                isCompleted: false
              })
              globalIndex += moduleGroups[key].length
            }
          })
        })
      } else {
        // Single subject: Module 1 → Module 2
        const moduleOrder = ['module1', 'module2']

        moduleOrder.forEach(mod => {
          Object.keys(moduleGroups).forEach(key => {
            if (key.endsWith(`-${mod}`) && moduleGroups[key].length > 0) {
              const subjectName = key.split('-')[0]
              modules.push({
                subject: subjectName,
                module: mod,
                questions: moduleGroups[key],
                startIndex: globalIndex,
                answers: {},
                flagged: {},
                isCompleted: false
              })
              globalIndex += moduleGroups[key].length
            }
          })
        })
      }

      setSession({
        testName: displayName,
        isCompleteExam,
        modules,
        currentModuleIndex: 0,
        currentQuestionIndex: 0,
        globalQuestionIndex: 0,
        totalQuestions: globalIndex,
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
    if (!session || !session.modules[session.currentModuleIndex]) return

    const currentModule = session.modules[session.currentModuleIndex]
    const questionId = currentModule.questions[session.currentQuestionIndex].metadata.id
    const answerValue = typeof answer === 'object' ? answer.letter : answer

    setSession(prev => {
      if (!prev) return null

      const newModules = [...prev.modules]
      newModules[prev.currentModuleIndex] = {
        ...newModules[prev.currentModuleIndex],
        answers: {
          ...newModules[prev.currentModuleIndex].answers,
          [questionId]: answerValue
        }
      }

      return {
        ...prev,
        modules: newModules
      }
    })
  }

  const goToNextQuestion = () => {
    if (!session) return

    const currentModule = session.modules[session.currentModuleIndex]

    if (session.currentQuestionIndex < currentModule.questions.length - 1) {
      // Move to next question in current module
      setSession(prev => prev ? {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        globalQuestionIndex: prev.globalQuestionIndex + 1
      } : null)
    } else {
      // End of current module
      if (session.currentModuleIndex < session.modules.length - 1) {
        // Move to next module
        setSession(prev => {
          if (!prev) return null

          const newModules = [...prev.modules]
          newModules[prev.currentModuleIndex].isCompleted = true

          return {
            ...prev,
            modules: newModules,
            currentModuleIndex: prev.currentModuleIndex + 1,
            currentQuestionIndex: 0,
            globalQuestionIndex: prev.globalQuestionIndex + 1
          }
        })
      } else {
        // Test completed
        setSession(prev => {
          if (!prev) return null

          const newModules = [...prev.modules]
          newModules[prev.currentModuleIndex].isCompleted = true

          return {
            ...prev,
            modules: newModules,
            isCompleted: true
          }
        })
        setShowResults(true)
      }
    }
  }

  const goToPreviousQuestion = () => {
    if (!session) return

    if (session.currentQuestionIndex > 0) {
      // Move to previous question in current module
      setSession(prev => prev ? {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
        globalQuestionIndex: prev.globalQuestionIndex - 1
      } : null)
    } else if (session.currentModuleIndex > 0) {
      // Move to previous module
      const prevModule = session.modules[session.currentModuleIndex - 1]
      setSession(prev => {
        if (!prev) return null

        const newModules = [...prev.modules]
        newModules[prev.currentModuleIndex - 1].isCompleted = false

        return {
          ...prev,
          modules: newModules,
          currentModuleIndex: prev.currentModuleIndex - 1,
          currentQuestionIndex: prevModule.questions.length - 1,
          globalQuestionIndex: prev.globalQuestionIndex - 1
        }
      })
    }
  }

  const togglePause = () => {
    if (!session) return

    setSession(prev => prev ? {
      ...prev,
      isPaused: !prev.isPaused,
      startTime: !prev.isPaused ? prev.startTime : Date.now() - prev.timeSpent
    } : null)
  }

  const toggleFlag = (questionId?: string) => {
    if (!session) return

    const currentModule = session.modules[session.currentModuleIndex]
    const targetQuestionId = questionId || currentModule.questions[session.currentQuestionIndex].metadata.id

    setSession(prev => {
      if (!prev) return null

      const newModules = [...prev.modules]
      const moduleIndex = newModules.findIndex(m =>
        m.questions.some(q => q.metadata.id === targetQuestionId)
      )

      if (moduleIndex !== -1) {
        newModules[moduleIndex] = {
          ...newModules[moduleIndex],
          flagged: {
            ...newModules[moduleIndex].flagged,
            [targetQuestionId]: !newModules[moduleIndex].flagged[targetQuestionId]
          }
        }
      }

      return {
        ...prev,
        modules: newModules
      }
    })
  }

  const goToQuestion = (moduleIndex: number, questionIndex: number) => {
    if (!session) return

    // Mark current module as incomplete if we're navigating backwards
    const newModules = [...session.modules]
    if (moduleIndex < session.currentModuleIndex) {
      newModules[session.currentModuleIndex].isCompleted = false
    }

    // Calculate global question index
    let globalIndex = 0
    for (let i = 0; i < moduleIndex; i++) {
      globalIndex += session.modules[i].questions.length
    }
    globalIndex += questionIndex

    setSession(prev => prev ? {
      ...prev,
      modules: newModules,
      currentModuleIndex: moduleIndex,
      currentQuestionIndex: questionIndex,
      globalQuestionIndex: globalIndex
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
    if (!session) return { correct: 0, total: 0, percentage: 0, byModule: [] }

    let correct = 0
    const total = session.totalQuestions
    const moduleScores: Array<{ module: string, correct: number, total: number }> = []

    session.modules.forEach(module => {
      let moduleCorrect = 0

      module.questions.forEach(question => {
        const questionId = question.metadata.id
        const userAnswer = module.answers[questionId]

        if (question.format === 'bluebook') {
          const bluebookQ = question.question as any
          if (userAnswer === bluebookQ.correct) {
            moduleCorrect++
            correct++
          }
        }
      })

      moduleScores.push({
        module: `${module.subject} ${module.module}`,
        correct: moduleCorrect,
        total: module.questions.length
      })
    })

    return {
      correct,
      total,
      percentage: Math.round((correct / total) * 100),
      byModule: moduleScores
    }
  }

  const getCurrentAnsweredCount = () => {
    if (!session) return 0

    return session.modules.reduce((total, module) =>
      total + Object.keys(module.answers).length, 0
    )
  }

  // Question Grid Component
  const QuestionGrid = () => {
    if (!session) return null

    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Question Navigator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {session.modules.map((module, moduleIndex) => (
              <div key={`${module.subject}-${module.module}`}>
                <div className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {module.subject} - {module.module}
                </div>
                <div className="flex flex-wrap gap-2">
                  {module.questions.map((question, questionIndex) => {
                    const questionId = question.metadata.id
                    const isAnswered = !!module.answers[questionId]
                    const isFlagged = !!module.flagged[questionId]
                    const isCurrent = moduleIndex === session.currentModuleIndex &&
                      questionIndex === session.currentQuestionIndex
                    const questionNumber = questionIndex + 1

                    return (
                      <button
                        key={questionId}
                        onClick={() => goToQuestion(moduleIndex, questionIndex)}
                        className={`
                          relative w-10 h-10 rounded-md border-2 text-sm font-medium transition-all flex-shrink-0
                          ${isCurrent
                            ? 'border-primary bg-primary text-primary-foreground ring-2 ring-primary/20'
                            : isAnswered
                              ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20'
                              : 'border-muted-foreground/30 bg-background hover:border-primary/50 hover:bg-muted/50'
                          }
                        `}
                      >
                        <span className="relative z-10">{questionNumber}</span>
                        {isFlagged && (
                          <Flag className="absolute -top-1 -right-1 h-3 w-3 text-amber-500 fill-amber-500" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="pt-4 mt-4 border-t">
            <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-primary bg-primary"></div>
                <span>Current question</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-green-500 bg-green-500/10"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-muted-foreground/30"></div>
                <span>Not answered</span>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span>Flagged for review</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
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
                <Link href="/leaked-exams">
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

  // Results Grid Component
  const ResultsGrid = () => {
    if (!session) return null

    const getQuestionStatus = (moduleIndex: number, questionIndex: number) => {
      const module = session.modules[moduleIndex]
      const question = module.questions[questionIndex]
      const questionId = question.metadata.id
      const userAnswer = module.answers[questionId]

      if (!userAnswer) return 'not-answered'

      let isCorrect = false
      if (question.format === 'bluebook') {
        const bluebookQ = question.question as any
        isCorrect = userAnswer === bluebookQ.correct
      } else if (question.format === 'oneprep') {
        const onePrepQ = question.question as any
        if (onePrepQ.answer_type === 'mcq') {
          const correctChoice = onePrepQ.choices.find((c: any) => c.is_correct)
          isCorrect = userAnswer === correctChoice?.letter
        } else if (onePrepQ.answer_type === 'spr') {
          isCorrect = onePrepQ.spr_answers.some((answer: string) =>
            answer.toLowerCase().trim() === userAnswer.toLowerCase().trim()
          )
        }
      }

      return isCorrect ? 'correct' : 'incorrect'
    }

    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Question Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {session.modules.map((module, moduleIndex) => (
              <div key={`${module.subject}-${module.module}`}>
                <div className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {module.subject} - {module.module}
                </div>
                <div className="flex flex-wrap gap-2">
                  {module.questions.map((question, questionIndex) => {
                    const questionNumber = questionIndex + 1
                    const status = getQuestionStatus(moduleIndex, questionIndex)

                    return (
                      <button
                        key={question.metadata.id}
                        onClick={() => {
                          const userAnswer = module.answers[question.metadata.id] || null
                          setSelectedResultQuestion({
                            moduleIndex,
                            questionIndex,
                            question,
                            userAnswer,
                            status
                          })
                        }}
                        className={`
                          w-10 h-10 rounded-md border-2 text-sm font-medium flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 cursor-pointer
                          ${status === 'correct'
                            ? 'border-green-500 bg-green-500 text-white hover:bg-green-600'
                            : status === 'incorrect'
                              ? 'border-red-500 bg-red-500 text-white hover:bg-red-600'
                              : 'border-gray-400 bg-gray-400 text-white hover:bg-gray-500'
                          }
                        `}
                      >
                        {questionNumber}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="pt-4 mt-4 border-t">
            <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-green-500 bg-green-500"></div>
                <span>Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-red-500 bg-red-500"></div>
                <span>Incorrect</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-gray-400 bg-gray-400"></div>
                <span>Not answered</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Results view
  if (showResults) {
    const score = calculateScore()
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Score Summary Card */}
            <Card>
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

                  {/* Module breakdown */}
                  {score.byModule.length > 1 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Module Results:</h4>
                      {score.byModule.map((moduleScore, index) => (
                        <div key={moduleScore.module} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">{moduleScore.module}</span>
                          <span className="text-sm font-medium">
                            {moduleScore.correct}/{moduleScore.total} ({Math.round((moduleScore.correct / moduleScore.total) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    <div>Test: {session.testName}</div>
                    <div>Time: {formatTime(session.timeSpent)}</div>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Link href="/leaked-exams">
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

            {/* Results Grid */}
            <ResultsGrid />
          </div>

          {/* Question Review Dialog */}
          <Dialog open={!!selectedResultQuestion} onOpenChange={(open) => !open && setSelectedResultQuestion(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              {selectedResultQuestion && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <span>Question {selectedResultQuestion.questionIndex + 1}</span>
                      <Badge variant="outline" className="text-xs">
                        {session.modules[selectedResultQuestion.moduleIndex].subject} - {session.modules[selectedResultQuestion.moduleIndex].module}
                      </Badge>
                      <Badge
                        variant={selectedResultQuestion.status === 'correct' ? 'default' : selectedResultQuestion.status === 'incorrect' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {selectedResultQuestion.status === 'correct' ? '✓ Correct' :
                          selectedResultQuestion.status === 'incorrect' ? '✗ Incorrect' :
                            '— Not Answered'}
                      </Badge>
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Show the question */}
                    <QuestionCard
                      data={selectedResultQuestion.question.question}
                      format={selectedResultQuestion.question.format}
                      showExplanation={true}
                      currentAnswer={selectedResultQuestion.userAnswer}
                      isPracticeMode={false}
                      questionNumber={selectedResultQuestion.questionIndex + 1}
                    />

                    {/* Show user's answer */}
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Your Answer:</h4>
                          <div className="flex items-center gap-2">
                            {selectedResultQuestion.userAnswer ? (
                              <>
                                <Badge variant="outline">{selectedResultQuestion.userAnswer}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {selectedResultQuestion.status === 'correct' ? '(Correct)' : '(Incorrect)'}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">No answer provided</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
        <Footer />
      </div>
    )
  }

  if (!session.modules[session.currentModuleIndex]) {
    return null
  }

  const currentModule = session.modules[session.currentModuleIndex]
  const currentQuestion = currentModule.questions[session.currentQuestionIndex]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Test Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/leaked-exams">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Exit Test
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{session.testName}</h1>
                <div className="text-sm text-muted-foreground">
                  <div>{session.modules[session.currentModuleIndex].subject} - {session.modules[session.currentModuleIndex].module}</div>
                  <div>
                    Question {session.currentQuestionIndex + 1} of {session.modules[session.currentModuleIndex].questions.length}
                    {session.modules.length > 1 && (
                      <span> • Module {session.currentModuleIndex + 1} of {session.modules.length}</span>
                    )}
                  </div>
                </div>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Test Progress</span>
              <span>{getCurrentAnsweredCount()} of {session.totalQuestions} answered</span>
            </div>
            <Progress value={(getCurrentAnsweredCount() / session.totalQuestions) * 100} className="h-2" />
          </div>
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
            {/* Module info banner */}
            <Card className="mb-6">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="font-semibold">
                      {session.modules[session.currentModuleIndex].subject} - {session.modules[session.currentModuleIndex].module}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Object.keys(session.modules[session.currentModuleIndex].answers).length} of {session.modules[session.currentModuleIndex].questions.length} answered
                  </div>
                </div>
              </CardContent>
            </Card>

            <QuestionCard
              key={session.modules[session.currentModuleIndex].questions[session.currentQuestionIndex].metadata.id}
              data={session.modules[session.currentModuleIndex].questions[session.currentQuestionIndex].question}
              format={session.modules[session.currentModuleIndex].questions[session.currentQuestionIndex].format}
              showExplanation={false}
              onAnswer={handleAnswer}
              currentAnswer={session.modules[session.currentModuleIndex].answers[session.modules[session.currentModuleIndex].questions[session.currentQuestionIndex].metadata.id]}
              onFlag={() => toggleFlag()}
              isFlagged={!!session.modules[session.currentModuleIndex].flagged[session.modules[session.currentModuleIndex].questions[session.currentQuestionIndex].metadata.id]}
              questionNumber={session.currentQuestionIndex + 1}
              isPracticeMode={true}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={goToPreviousQuestion}
                disabled={session.currentQuestionIndex === 0 && session.currentModuleIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  Question {session.currentQuestionIndex + 1} of {session.modules[session.currentModuleIndex].questions.length}
                </span>
                <Badge variant="outline">
                  {session.modules[session.currentModuleIndex].subject} - {session.modules[session.currentModuleIndex].module}
                </Badge>
              </div>

              <Button onClick={goToNextQuestion}>
                {session.currentModuleIndex === session.modules.length - 1 &&
                  session.currentQuestionIndex === session.modules[session.currentModuleIndex].questions.length - 1 ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finish Test
                  </>
                ) : session.currentQuestionIndex === session.modules[session.currentModuleIndex].questions.length - 1 ? (
                  <>
                    Next Module
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Question Navigator Grid */}
            <div className="mt-6">
              <QuestionGrid />
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}