"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { AuthPopup } from '@/components/auth-popup'

interface Choice {
  id: number
  letter: string
  html: string
  text: string
  is_correct: boolean
}

interface Question {
  question_id: number
  answer_type: string
  stem: string
  explanation: string
  choices: Choice[]
}

interface QuestionComponentProps {
  question: Question
  showExplanation?: boolean
  onAnswer?: (selectedChoice: Choice, isCorrect: boolean) => void
}

export function QuestionComponent({ question, showExplanation = false, onAnswer }: QuestionComponentProps) {
  const { requireAuth, showAuthPopup, closeAuthPopup, handleAuthSuccess } = useAuthGuard()
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)

  const handleChoiceSelect = (choice: Choice) => {
    if (hasAnswered) return

    // Require authentication before processing the answer
    const authorized = requireAuth(() => {
      processChoiceSelection(choice)
    })

    // If not authorized, auth popup will show and the callback will run after auth
    if (authorized) {
      processChoiceSelection(choice)
    }
  }

  const processChoiceSelection = (choice: Choice) => {
    setSelectedChoice(choice)
    setShowResult(true)
    setHasAnswered(true)

    if (onAnswer) {
      onAnswer(choice, choice.is_correct)
    }
  }

  const resetQuestion = () => {
    setSelectedChoice(null)
    setShowResult(false)
    setHasAnswered(false)
  }

  const getChoiceStatus = (choice: Choice) => {
    if (!showResult) return "default"
    if (choice.is_correct) return "correct"
    if (selectedChoice?.id === choice.id && !choice.is_correct) return "incorrect"
    return "default"
  }

  const getChoiceIcon = (choice: Choice) => {
    const status = getChoiceStatus(choice)
    if (status === "correct") return <CheckCircle className="h-4 w-4 text-green-600" />
    if (status === "incorrect") return <XCircle className="h-4 w-4 text-red-600" />
    return null
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-balance">Question {question.question_id}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {question.answer_type.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question Stem */}
        <div className="prose prose-sm max-w-none">
          <p className="text-foreground leading-relaxed text-pretty">{question.stem}</p>
        </div>

        {/* Answer Choices */}
        <div className="space-y-3">
          {question.choices.map((choice) => (
            <Button
              key={choice.id}
              variant={selectedChoice?.id === choice.id ? "default" : "outline"}
              className={`w-full justify-start text-left p-4 h-auto min-h-[3rem] ${
                getChoiceStatus(choice) === "correct"
                  ? "bg-green-50 border-green-200 hover:bg-green-100 text-green-800"
                  : getChoiceStatus(choice) === "incorrect"
                    ? "bg-red-50 border-red-200 hover:bg-red-100 text-red-800"
                    : ""
              }`}
              onClick={() => handleChoiceSelect(choice)}
              disabled={hasAnswered}
            >
              <div className="flex items-center gap-3 w-full">
                <span className="font-semibold text-sm bg-muted px-2 py-1 rounded">{choice.letter}</span>
                <span className="flex-1 text-sm" dangerouslySetInnerHTML={{ __html: choice.html }} />
                {getChoiceIcon(choice)}
              </div>
            </Button>
          ))}
        </div>

        {/* Result and Explanation */}
        {showResult && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              {selectedChoice?.is_correct ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-700">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-700">Incorrect</span>
                </>
              )}
            </div>

            {(showExplanation || showResult) && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Explanation</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{question.explanation}</p>
                  </div>
                </div>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={resetQuestion} className="mt-4 bg-transparent">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
      </Card>
      <AuthPopup
        isOpen={showAuthPopup}
        onClose={closeAuthPopup}
        onSuccess={handleAuthSuccess}
      />
    </>
  )
}
