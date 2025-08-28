"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { QuestionComponent } from "@/components/question-component"
import { Clock, ArrowLeft, ArrowRight, Flag, CheckCircle, Target } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

// Mock test data - in real app this would come from API
const mockTest = {
  id: 1,
  title: "Official SAT Practice Test #1",
  sections: [
    {
      name: "Reading",
      duration: 65,
      questions: [
        {
          question_id: 1001,
          answer_type: "mcq",
          stem: "The passage suggests that the author's primary concern is:",
          explanation: "The author's main focus throughout the passage is on environmental conservation.",
          choices: [
            {
              id: 1,
              letter: "A",
              html: "<p>economic development</p>",
              text: "economic development",
              is_correct: false,
            },
            {
              id: 2,
              letter: "B",
              html: "<p>environmental conservation</p>",
              text: "environmental conservation",
              is_correct: true,
            },
            {
              id: 3,
              letter: "C",
              html: "<p>technological advancement</p>",
              text: "technological advancement",
              is_correct: false,
            },
            { id: 4, letter: "D", html: "<p>social reform</p>", text: "social reform", is_correct: false },
          ],
        },
      ],
    },
    {
      name: "Writing & Language",
      duration: 35,
      questions: [
        {
          question_id: 1002,
          answer_type: "mcq",
          stem: "Which choice provides the most effective transition to the next paragraph?",
          explanation: "The transition should connect the previous discussion to the new topic being introduced.",
          choices: [
            {
              id: 5,
              letter: "A",
              html: "<p>However, this approach has limitations.</p>",
              text: "However, this approach has limitations.",
              is_correct: true,
            },
            {
              id: 6,
              letter: "B",
              html: "<p>In conclusion, the results were positive.</p>",
              text: "In conclusion, the results were positive.",
              is_correct: false,
            },
            {
              id: 7,
              letter: "C",
              html: "<p>Furthermore, the data supports this.</p>",
              text: "Furthermore, the data supports this.",
              is_correct: false,
            },
            {
              id: 8,
              letter: "D",
              html: "<p>DELETE the underlined sentence.</p>",
              text: "DELETE the underlined sentence.",
              is_correct: false,
            },
          ],
        },
      ],
    },
  ],
}

export default function PracticeTestPage() {
  const params = useParams()
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(65 * 60) // 65 minutes in seconds
  const [answers, setAnswers] = useState<Record<number, any>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const currentSection = mockTest.sections[currentSectionIndex]
  const currentQuestion = currentSection?.questions[currentQuestionIndex]
  const totalQuestions = mockTest.sections.reduce((sum, section) => sum + section.questions.length, 0)
  const answeredQuestions = Object.keys(answers).length

  // Timer effect
  useEffect(() => {
    if (!isTestStarted || showResults) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setShowResults(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isTestStarted, showResults])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswer = (selectedChoice: any, isCorrect: boolean) => {
    if (currentQuestion) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.question_id]: {
          choice: selectedChoice,
          isCorrect,
        },
      }))
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else if (currentSectionIndex < mockTest.sections.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1)
      setCurrentQuestionIndex(0)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1)
      setCurrentQuestionIndex(mockTest.sections[currentSectionIndex - 1].questions.length - 1)
    }
  }

  const toggleFlag = () => {
    if (currentQuestion) {
      setFlaggedQuestions((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(currentQuestion.question_id)) {
          newSet.delete(currentQuestion.question_id)
        } else {
          newSet.add(currentQuestion.question_id)
        }
        return newSet
      })
    }
  }

  const finishTest = () => {
    setShowResults(true)
  }

  if (!isTestStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-4">{mockTest.title}</CardTitle>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Total Questions:</strong> {totalQuestions}
                </div>
                <div>
                  <strong>Total Time:</strong> {formatTime(timeRemaining)}
                </div>
              </div>
              <div>
                <strong>Sections:</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {mockTest.sections.map((section, index) => (
                    <Badge key={index} variant="outline">
                      {section.name} ({section.questions.length} questions)
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Make sure you have a quiet environment and enough time to complete the test. The timer will start as soon
              as you begin.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/practice-tests">
                <Button variant="outline" className="bg-transparent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tests
                </Button>
              </Link>
              <Button onClick={() => setIsTestStarted(true)} size="lg">
                Start Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showResults) {
    const correctAnswers = Object.values(answers).filter((answer) => answer.isCorrect).length
    const score = Math.round((correctAnswers / totalQuestions) * 100)

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Easy1600</span>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl mb-4">Test Complete!</CardTitle>
              <div className="text-6xl font-bold text-primary mb-4">{score}%</div>
              <p className="text-muted-foreground">
                You answered {correctAnswers} out of {totalQuestions} questions correctly
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{totalQuestions - correctAnswers}</div>
                  <div className="text-sm text-muted-foreground">Incorrect</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Link href="/practice-tests">
                  <Button variant="outline" className="bg-transparent">
                    Back to Tests
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setIsTestStarted(false)
                    setShowResults(false)
                    setCurrentSectionIndex(0)
                    setCurrentQuestionIndex(0)
                    setAnswers({})
                    setTimeRemaining(65 * 60)
                  }}
                >
                  Retake Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Test Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-bold">Easy1600</span>
              </div>
              <Badge variant="outline">{currentSection.name}</Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span className={timeRemaining < 300 ? "text-red-600 font-bold" : ""}>{formatTime(timeRemaining)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={finishTest} className="bg-transparent">
                Finish Test
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>
                Question {currentQuestionIndex + 1} of {currentSection.questions.length}
              </span>
              <span>
                {answeredQuestions} of {totalQuestions} answered
              </span>
            </div>
            <Progress value={(answeredQuestions / totalQuestions) * 100} className="h-2" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {currentQuestion && (
            <div className="space-y-6">
              <QuestionComponent question={currentQuestion} onAnswer={handleAnswer} showExplanation={false} />

              {/* Navigation Controls */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
                      className="bg-transparent"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFlag}
                        className={`bg-transparent ${
                          flaggedQuestions.has(currentQuestion.question_id) ? "text-yellow-600 border-yellow-600" : ""
                        }`}
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        {flaggedQuestions.has(currentQuestion.question_id) ? "Flagged" : "Flag"}
                      </Button>

                      {answers[currentQuestion.question_id] && (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Answered
                        </Badge>
                      )}
                    </div>

                    <Button
                      onClick={handleNext}
                      disabled={
                        currentSectionIndex === mockTest.sections.length - 1 &&
                        currentQuestionIndex === currentSection.questions.length - 1
                      }
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
