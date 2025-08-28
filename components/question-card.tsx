"use client"

import { QuestionCardOnePrep } from "./question-card-oneprep"
import { QuestionCardBlueBook } from "./question-card-bluebook"
import { QuestionCardProps, OnePrepQuestion, BlueBookQuestion } from "@/types/question-types"

/**
 * Unified Question Card component that renders either OnePrep or BlueBook format questions
 * 
 * @param data - Question data in either OnePrep or BlueBook format
 * @param format - Specifies which format the data is in ("oneprep" | "bluebook")
 * @param showExplanation - Whether to show explanations immediately
 * @param onAnswer - Callback when user answers the question
 * @param onReset - Callback when user resets the question
 */
export function QuestionCard({ 
  data, 
  format, 
  showExplanation = false, 
  onAnswer, 
  onReset 
}: QuestionCardProps) {
  
  // Type guard to check if data is OnePrep format
  const isOnePrepQuestion = (question: any): question is OnePrepQuestion => {
    return format === "oneprep" && 
           typeof question.question_id === "number" &&
           typeof question.answer_type === "string" &&
           Array.isArray(question.choices)
  }

  // Type guard to check if data is BlueBook format  
  const isBlueBookQuestion = (question: any): question is BlueBookQuestion => {
    return format === "bluebook" &&
           typeof question.type === "string" &&
           typeof question.article === "string" &&
           Array.isArray(question.options)
  }

  // Handle OnePrep format
  if (isOnePrepQuestion(data)) {
    return (
      <QuestionCardOnePrep
        question={data}
        showExplanation={showExplanation}
        onAnswer={onAnswer ? (choice, isCorrect) => onAnswer(choice, isCorrect) : undefined}
        onReset={onReset}
      />
    )
  }

  // Handle BlueBook format
  if (isBlueBookQuestion(data)) {
    return (
      <QuestionCardBlueBook
        question={data}
        showExplanation={showExplanation}
        onAnswer={onAnswer ? (answer, isCorrect) => onAnswer(answer, isCorrect) : undefined}
        onReset={onReset}
      />
    )
  }

  // Fallback for invalid data
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
      <div className="flex items-center gap-2 text-destructive">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span className="font-semibold">Invalid Question Data</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        The question data format is not recognized. Please check that the data matches either OnePrep or BlueBook format.
      </p>
      <details className="mt-3">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
          Debug Info
        </summary>
        <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
          Format: {format}
          {"\n"}
          Data keys: {Object.keys(data || {}).join(", ")}
        </pre>
      </details>
    </div>
  )
}

// Export individual components for direct use if needed
export { QuestionCardOnePrep, QuestionCardBlueBook }
