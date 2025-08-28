// OnePrep question format (from ALLEXAMSONEPREP.json)
export interface OnePrepChoice {
  id: number
  letter: string
  html: string
  text: string
  is_correct: boolean
}

export interface OnePrepQuestion {
  question_id: number
  answer_type: "mcq" | "spr"
  stem_text: string
  stem_html: string
  explanation_text: string
  explanation_html: string
  choices: OnePrepChoice[]
  spr_answers: string[]
  meta: {
    is_marked_for_review: number
    answer_choices_status: Record<string, any>
  }
}

// BlueBook question format (from bluebookplus_tests_output)
export interface BlueBookOption {
  name: string
  content: string
}

export interface BlueBookQuestion {
  type: "choice" | "write"
  article: string
  question: string
  options: BlueBookOption[]
  correct: string
  solution: string
}

// Unified question props
export interface QuestionCardProps {
  data: OnePrepQuestion | BlueBookQuestion
  format: "oneprep" | "bluebook"
  showExplanation?: boolean
  onAnswer?: (answer: string | OnePrepChoice, isCorrect: boolean) => void
  onReset?: () => void
}

// Component-specific props
export interface OnePrepQuestionProps {
  question: OnePrepQuestion
  showExplanation?: boolean
  onAnswer?: (selectedChoice: OnePrepChoice, isCorrect: boolean) => void
  onReset?: () => void
}

export interface BlueBookQuestionProps {
  question: BlueBookQuestion
  showExplanation?: boolean
  onAnswer?: (answer: string, isCorrect: boolean) => void
  onReset?: () => void
}
