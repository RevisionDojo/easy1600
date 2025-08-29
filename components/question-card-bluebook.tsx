"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CheckCircle, XCircle, AlertCircle, Edit3, ImageIcon, Flag } from "lucide-react"
import { BlueBookQuestion, BlueBookQuestionProps } from "@/types/question-types"
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { AuthPopup } from '@/components/auth-popup'
import 'katex/dist/katex.min.css'

// Dynamic import for KaTeX to avoid SSR issues
let katex: any = null
if (typeof window !== 'undefined') {
  import('katex').then(k => { katex = k.default })
}

export function QuestionCardBlueBook({
  question,
  showExplanation = false,
  onAnswer,
  onReset,
  currentAnswer,
  onFlag,
  isFlagged,
  questionNumber,
  isPracticeMode = false
}: BlueBookQuestionProps) {
  const { requireAuth, showAuthPopup, closeAuthPopup, handleAuthSuccess } = useAuthGuard()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [writeAnswer, setWriteAnswer] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  // Initialize with current answer if provided
  useEffect(() => {
    if (currentAnswer) {
      if (question.type === "choice") {
        setSelectedOption(currentAnswer)
      } else if (question.type === "write") {
        setWriteAnswer(currentAnswer)
      }
      // In practice mode, don't show results or mark as answered
      if (!isPracticeMode) {
        setHasAnswered(true)
        setShowResult(true)
      }
    } else {
      // Reset state when no current answer
      setSelectedOption(null)
      setWriteAnswer("")
      setHasAnswered(false)
      setShowResult(false)
    }
  }, [currentAnswer, question.type, isPracticeMode])

  const handleChoiceSelect = (optionName: string) => {
    if (hasAnswered && !isPracticeMode) return

    // Require authentication before processing the answer
    const authorized = requireAuth(() => {
      processChoiceSelection(optionName)
    })

    // If not authorized, auth popup will show and the callback will run after auth
    if (authorized) {
      processChoiceSelection(optionName)
    }
  }

  const processChoiceSelection = (optionName: string) => {
    setSelectedOption(optionName)

    // In practice mode, don't show results immediately
    if (!isPracticeMode) {
      setShowResult(true)
      setHasAnswered(true)
    }

    const selectedOptionData = question.options.find(opt => opt.name === optionName)
    const isCorrect = selectedOptionData?.content.trim() === question.correct.trim()

    if (onAnswer) {
      onAnswer(optionName, isCorrect)
    }
  }

  const handleWriteSubmit = () => {
    if ((hasAnswered && !isPracticeMode) || !writeAnswer.trim()) return

    // Require authentication before processing the answer
    const authorized = requireAuth(() => {
      processWriteSubmission()
    })

    // If not authorized, auth popup will show and the callback will run after auth
    if (authorized) {
      processWriteSubmission()
    }
  }

  const processWriteSubmission = () => {
    // Check if answer matches any of the accepted formats
    const normalizedAnswer = writeAnswer.trim().toLowerCase()
    const normalizedCorrect = question.correct.toLowerCase()

    // Handle multiple correct answer formats (comma-separated)
    const correctAnswers = normalizedCorrect.split(',').map(ans => ans.trim())
    const isCorrect = correctAnswers.includes(normalizedAnswer)

    // In practice mode, don't show results immediately
    if (!isPracticeMode) {
      setShowResult(true)
      setHasAnswered(true)
    }

    if (onAnswer) {
      onAnswer(writeAnswer, isCorrect)
    }
  }

  const resetQuestion = () => {
    setSelectedOption(null)
    setWriteAnswer("")
    setShowResult(false)
    setHasAnswered(false)
    if (onReset) onReset()
  }

  const getChoiceStatus = (optionName: string) => {
    if (!showResult) return "default"

    const option = question.options.find(opt => opt.name === optionName)
    if (!option) return "default"

    const isCorrectOption = option.content.trim() === question.correct.trim()

    if (isCorrectOption) return "correct"
    if (selectedOption === optionName && !isCorrectOption) return "incorrect"
    return "default"
  }

  const getChoiceIcon = (optionName: string) => {
    const status = getChoiceStatus(optionName)
    if (status === "correct") return <CheckCircle className="h-4 w-4 text-green-600" />
    if (status === "incorrect") return <XCircle className="h-4 w-4 text-red-600" />
    return null
  }

  const getWriteResult = () => {
    if (!showResult || question.type !== "write") return null

    const normalizedAnswer = writeAnswer.trim().toLowerCase()
    const normalizedCorrect = question.correct.toLowerCase()
    const correctAnswers = normalizedCorrect.split(',').map(ans => ans.trim())

    return correctAnswers.includes(normalizedAnswer)
  }

  // Process LaTeX and MathQuill content
  const processLatexContent = (html: string) => {
    if (!katex || typeof window === 'undefined') return html

    // Handle LaTeX data attributes
    return html.replace(/latex-data="([^"]+)"/g, (match, latexCode) => {
      try {
        const decodedLatex = latexCode
          .replace(/\\left/g, '\\left')
          .replace(/\\right/g, '\\right')
          .replace(/\\frac/g, '\\frac')

        const rendered = katex.renderToString(decodedLatex, {
          throwOnError: false,
          displayMode: false
        })
        return `data-katex-rendered="true" data-original-latex="${latexCode}"`
      } catch (error) {
        console.warn('KaTeX rendering error:', error)
        return match
      }
    })
  }

  // Handle image loading errors
  const handleImageError = (src: string) => {
    setImageErrors(prev => new Set([...prev, src]))
  }

  // Process content to handle images and math
  const processContent = (content: string) => {
    let processed = processLatexContent(content)

    // Add error handling for images
    processed = processed.replace(/<img([^>]+)src="([^"]+)"([^>]*)>/g, (match, before, src, after) => {
      if (imageErrors.has(src)) {
        return `<div class="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded text-sm text-muted-foreground border border-dashed">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
          Image unavailable
        </div>`
      }
      return `<img${before}src="${src}"${after} onError="this.style.display='none'; this.nextSibling.style.display='inline-flex';" />
        <div style="display:none" class="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded text-sm text-muted-foreground border border-dashed">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
          Image unavailable
        </div>`
    })

    return processed
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-balance">
            {question.type === "write" ? "Student Response" : `Question ${questionNumber || 1}`}
          </CardTitle>
          {onFlag && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFlag}
              className={`${isFlagged ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:hover:bg-amber-900/30 dark:text-amber-200' : ''
                }`}
            >
              <Flag className={`h-4 w-4 mr-2 ${isFlagged ? 'fill-amber-500 text-amber-500' : ''
                }`} />
              <span className="hidden sm:inline">
                {isFlagged ? 'Unflag' : 'Flag for Review'}
              </span>
              <span className="sm:hidden">
                {isFlagged ? 'Unflag' : 'Flag'}
              </span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question Content */}
        <div className="prose prose-sm max-w-none">
          <div
            className="text-foreground leading-relaxed text-pretty [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:border [&_img]:shadow-sm"
            dangerouslySetInnerHTML={{ __html: processContent(question.article) }}
          />
          {question.question && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
              <p className="text-sm font-medium text-foreground">
                {question.question}
              </p>
            </div>
          )}
        </div>

        {/* Multiple Choice Options */}
        {question.type === "choice" && question.options.length > 0 && (
          <div className="space-y-3">
            {question.options.map((option) => (
              <Button
                key={option.name}
                variant={selectedOption === option.name ? "default" : "outline"}
                className={`w-full justify-start text-left p-4 h-auto min-h-[3rem] whitespace-normal ${!isPracticeMode && getChoiceStatus(option.name) === "correct"
                  ? "bg-green-50 border-green-200 hover:bg-green-100 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:hover:bg-green-900/30 dark:text-green-200"
                  : !isPracticeMode && getChoiceStatus(option.name) === "incorrect"
                    ? "bg-red-50 border-red-200 hover:bg-red-100 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:hover:bg-red-900/30 dark:text-red-200"
                    : ""
                  }`}
                onClick={() => handleChoiceSelect(option.name)}
                disabled={hasAnswered && !isPracticeMode}
              >
                <div className="flex items-start gap-3 w-full">
                  <span className={`font-semibold text-sm px-2 py-1 rounded flex-shrink-0 ${selectedOption === option.name
                    ? 'bg-primary-foreground text-primary'
                    : 'bg-muted text-foreground'
                    }`}>
                    {option.name}
                  </span>
                  <span
                    className="flex-1 text-sm break-words [&_.katex]:text-current"
                    dangerouslySetInnerHTML={{ __html: processContent(option.content) }}
                  />
                  <div className="flex-shrink-0">
                    {!isPracticeMode && getChoiceIcon(option.name)}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}

        {/* Write-in Response */}
        {question.type === "write" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Edit3 className="h-4 w-4" />
              <span>Enter your numerical answer</span>
            </div>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Enter your answer..."
                value={writeAnswer}
                onChange={(e) => setWriteAnswer(e.target.value)}
                disabled={hasAnswered && !isPracticeMode}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !(hasAnswered && !isPracticeMode) && writeAnswer.trim()) {
                    handleWriteSubmit()
                  }
                }}
              />
              <Button
                onClick={handleWriteSubmit}
                disabled={(hasAnswered && !isPracticeMode) || !writeAnswer.trim()}
                className="px-6"
              >
                Submit
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Enter your answer as a number, fraction, or decimal</p>
            </div>
          </div>
        )}

        {/* Result and Explanation */}
        {showResult && !isPracticeMode && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              {(question.type === "choice"
                ? question.options.find(opt => opt.name === selectedOption)?.content.trim() === question.correct.trim()
                : getWriteResult()
              ) ? (
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

            {/* Show correct answer for write questions */}
            {question.type === "write" && showResult && !getWriteResult() && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Correct answer:</p>
                <Badge variant="secondary" className="text-sm">
                  {question.correct}
                </Badge>
              </div>
            )}

            {/* Explanation (if available) */}
            {(showExplanation || showResult) && question.solution && question.solution.trim() && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-2">Solution</h4>
                    <div
                      className="text-sm text-muted-foreground leading-relaxed text-pretty prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: processContent(question.solution) }}
                    />
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
      <AuthPopup
        isOpen={showAuthPopup}
        onClose={closeAuthPopup}
        onSuccess={handleAuthSuccess}
      />
    </>
  )
}
