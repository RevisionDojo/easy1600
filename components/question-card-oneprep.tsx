"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CheckCircle, XCircle, AlertCircle, Edit3, Flag } from "lucide-react"
import { OnePrepQuestion, OnePrepChoice, OnePrepQuestionProps } from "@/types/question-types"

// Function to extract clean question content from corrupted OnePrep text
const extractQuestionFromOnePrep = (text: string): string => {
  if (!text) return ''

  // From your example: "In the linear function f , f0=8 and f1=12. Which equation defines f ?"
  // This appears after a lot of junk and before answer choices

  // Pattern 1: Look for "In the linear function" through "?"
  let match = text.match(/(In the linear function.*?\?)/s)
  if (match && match[1]) {
    return `<p>${match[1].trim()}</p>`
  }

  // Pattern 2: Look for any math function question pattern
  match = text.match(/(In the .*? function.*?\?)/s)
  if (match && match[1]) {
    return `<p>${match[1].trim()}</p>`
  }

  // Pattern 3: Extract content between common markers and question mark
  match = text.match(/(?:ABC|close)\s+(.*?\?)/s)
  if (match && match[1]) {
    const questionText = match[1]
      .replace(/\s+/g, ' ')
      .trim()
    // Make sure it's a reasonable question length and contains question words
    if (questionText.length > 15 && questionText.length < 300 &&
      (questionText.includes('function') || questionText.includes('equation') || questionText.includes('Which'))) {
      return `<p>${questionText}</p>`
    }
  }

  return ''
}

// Function to sanitize HTML content by removing OnePrep-specific styling
const sanitizeHtml = (html: string): string => {
  if (!html) return html

  return html
    // Remove OnePrep-specific classes and spans
    .replace(/<span[^>]*class="[^"]*standalone_statement_src[^"]*"[^>]*>.*?<\/span>/gs, '')
    .replace(/<span[^>]*style="color:\s*transparent"[^>]*>.*?<\/span>/gs, '')
    // Remove any remaining OnePrep references
    .replace(/This content is collected from OnePrep\.xyz/gi, '')
    .replace(/OnePrep\.xyz/gi, '')
    // Clean up any empty spans or extra whitespace
    .replace(/<span><span><span[^>]*><\/span><\/span><\/span>/g, '')
    .replace(/<span><\/span>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function QuestionCardOnePrep({
  question,
  showExplanation = false,
  onAnswer,
  onReset,
  currentAnswer,
  onFlag,
  isFlagged,
  questionNumber,
  isPracticeMode = false
}: OnePrepQuestionProps) {
  const [selectedChoice, setSelectedChoice] = useState<OnePrepChoice | null>(null)
  const [sprAnswer, setSprAnswer] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)

  // Initialize with current answer if provided
  useEffect(() => {
    if (currentAnswer) {
      if (question.answer_type === "mcq") {
        const choice = question.choices.find(c => c.letter === currentAnswer)
        if (choice) {
          setSelectedChoice(choice)
        }
      } else if (question.answer_type === "spr") {
        setSprAnswer(currentAnswer)
      }
      // In practice mode, don't show results or mark as answered
      if (!isPracticeMode) {
        setHasAnswered(true)
        setShowResult(true)
      }
    } else {
      // Reset state when no current answer
      setSelectedChoice(null)
      setSprAnswer("")
      setHasAnswered(false)
      setShowResult(false)
    }
  }, [currentAnswer, question.answer_type, isPracticeMode])

  const handleChoiceSelect = (choice: OnePrepChoice) => {
    if (hasAnswered && !isPracticeMode) return

    setSelectedChoice(choice)

    if (!isPracticeMode) {
      setShowResult(true)
      setHasAnswered(true)
    }

    if (onAnswer) {
      onAnswer(choice, choice.is_correct)
    }
  }

  const handleSprSubmit = () => {
    if ((hasAnswered && !isPracticeMode) || !sprAnswer.trim()) return

    const isCorrect = question.spr_answers.some(
      answer => answer.toLowerCase().trim() === sprAnswer.toLowerCase().trim()
    )

    if (!isPracticeMode) {
      setShowResult(true)
      setHasAnswered(true)
    }

    if (onAnswer) {
      onAnswer({
        id: -1,
        letter: "SPR",
        html: sprAnswer,
        text: sprAnswer,
        is_correct: isCorrect
      }, isCorrect)
    }
  }

  const resetQuestion = () => {
    setSelectedChoice(null)
    setSprAnswer("")
    setShowResult(false)
    setHasAnswered(false)
    if (onReset) onReset()
  }

  const getChoiceStatus = (choice: OnePrepChoice) => {
    if (!showResult) return "default"
    if (choice.is_correct) return "correct"
    if (selectedChoice?.id === choice.id && !choice.is_correct) return "incorrect"
    return "default"
  }

  const getChoiceIcon = (choice: OnePrepChoice) => {
    const status = getChoiceStatus(choice)
    if (status === "correct") return <CheckCircle className="h-4 w-4 text-green-600" />
    if (status === "incorrect") return <XCircle className="h-4 w-4 text-red-600" />
    return null
  }

  const getSprResult = () => {
    if (!showResult || question.answer_type !== "spr") return null

    const isCorrect = question.spr_answers.some(
      answer => answer.toLowerCase().trim() === sprAnswer.toLowerCase().trim()
    )

    return isCorrect
  }

  // Clean the stem HTML by removing OnePrep watermarks and problematic styling
  const cleanStemHtml = (html: string) => {
    // If it's corrupted OnePrep content, try to extract the question
    if (html.includes('window.dataLayer') || html.includes('gtag') || html.includes('Question ID #')) {
      const extracted = extractQuestionFromOnePrep(html)
      if (extracted) {
        return extracted
      }
      // If extraction fails, return empty to fall back to stem_text
      return ''
    }

    return sanitizeHtml(html)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-balance">
            Question {questionNumber || question.question_id}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {question.answer_type.toUpperCase()}
            </Badge>
            {question.meta.is_marked_for_review === 1 && (
              <Badge variant="outline" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Review
              </Badge>
            )}
            {onFlag && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onFlag}
                className={`h-8 w-8 p-0 ${isFlagged ? 'text-yellow-600 bg-yellow-50' : 'text-muted-foreground'}`}
              >
                <Flag className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question Stem */}
        <div className="prose prose-sm max-w-none">
          <p className="text-foreground leading-relaxed text-pretty">
            {(() => {
              const text = question.stem_text || ''

              // If corrupted with OnePrep content, extract just the question
              if (text.includes('window.dataLayer') || text.includes('OnePrep')) {
                const extracted = extractQuestionFromOnePrep(text)
                if (extracted) {
                  // Return just the text content without HTML wrapper
                  return extracted.replace(/<\/?p>/g, '')
                }
                return 'Math question (content being cleaned up)'
              }

              return text
            })()}
          </p>
        </div>

        {/* Multiple Choice Questions */}
        {question.answer_type === "mcq" && question.choices.length > 0 && (
          <div className="space-y-3">
            {question.choices.map((choice) => (
              <Button
                key={choice.id}
                variant={selectedChoice?.id === choice.id ? "default" : "outline"}
                className={`w-full justify-start text-left p-4 h-auto min-h-[3rem] whitespace-normal ${getChoiceStatus(choice) === "correct"
                  ? "bg-green-50 border-green-200 hover:bg-green-100 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:hover:bg-green-900/30 dark:text-green-200"
                  : getChoiceStatus(choice) === "incorrect"
                    ? "bg-red-50 border-red-200 hover:bg-red-100 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:hover:bg-red-900/30 dark:text-red-200"
                    : ""
                  }`}
                onClick={() => handleChoiceSelect(choice)}
                disabled={hasAnswered && !isPracticeMode}
              >
                <div className="flex items-start gap-3 w-full">
                  <span className="font-semibold text-sm bg-muted px-2 py-1 rounded flex-shrink-0">
                    {choice.letter}
                  </span>
                  <span
                    className="flex-1 text-sm break-words"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(choice.html) }}
                  />
                  <div className="flex-shrink-0">
                    {getChoiceIcon(choice)}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}

        {/* Student Produced Response (SPR) Questions */}
        {question.answer_type === "spr" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Edit3 className="h-4 w-4" />
              <span>Enter your answer below</span>
            </div>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Type your answer..."
                value={sprAnswer}
                onChange={(e) => setSprAnswer(e.target.value)}
                disabled={hasAnswered && !isPracticeMode}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !hasAnswered && sprAnswer.trim()) {
                    handleSprSubmit()
                  }
                }}
              />
              <Button
                onClick={handleSprSubmit}
                disabled={(hasAnswered && !isPracticeMode) || !sprAnswer.trim()}
                className="px-6"
              >
                Submit
              </Button>
            </div>
            {question.spr_answers.length > 0 && !hasAnswered && (
              <div className="text-xs text-muted-foreground">
                <p>Tip: Multiple answer formats may be accepted (e.g., 0.5, 1/2, .5)</p>
              </div>
            )}
          </div>
        )}

        {/* Result and Explanation */}
        {showResult && !isPracticeMode && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              {(question.answer_type === "mcq" ? selectedChoice?.is_correct : getSprResult()) ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-700 dark:text-green-400">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-700 dark:text-red-400">Incorrect</span>
                </>
              )}
            </div>

            {/* Show correct answer for SPR questions */}
            {question.answer_type === "spr" && showResult && !isPracticeMode && !getSprResult() && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Correct answer(s):</p>
                <div className="flex flex-wrap gap-2">
                  {question.spr_answers.map((answer, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {answer}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            {(showExplanation || (showResult && !isPracticeMode)) && question.explanation_text && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-2">Explanation</h4>
                    {question.explanation_html && !question.explanation_html.includes('window.dataLayer') && !question.explanation_html.includes('OnePrep') ? (
                      <div
                        className="text-sm text-muted-foreground leading-relaxed text-pretty prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.explanation_html) }}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                        {question.explanation_text}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={resetQuestion} className="mt-4">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
