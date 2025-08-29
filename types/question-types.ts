// Database schema types matching our uploaded data

// Official Practice Questions (from official_practice_questions table)
export interface OfficialPracticeQuestion {
  id: string
  question_id: number
  exam_id: string | null
  exam_name: string | null
  answer_type: "mcq" | "spr"
  stem_text: string
  stem_html: string
  explanation_text: string
  explanation_html: string
  choices: Array<{
    id: number
    letter: string
    html: string
    text: string
    is_correct: boolean
  }> | null
  correct_choice_letter: string | null
  spr_answers: string[] | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
}

// OP Question Bank (from op_question_bank table - College Board & Princeton)
export interface OpQuestionBankQuestion {
  id: string
  question_id: number
  question_url: string | null
  uuid: string | null
  source: "collegeboard" | "princeton"
  difficulty: string | null
  source_order: number | null
  primary_class: string | null
  skill: string | null
  module: string | null
  answer_type: "mcq" | "spr"
  stem_text: string | null
  stem_html: string | null
  answer_choices: Array<{
    id: number
    letter: string
    text: string
    html?: string
    is_correct: boolean
    explanation?: string
  }> | null
  correct_choice_letter: string | null
  spr_answers: string[] | null
  explanation_text: string | null
  explanation_html: string | null
  stimulus_text: string | null
  stimulus_html: string | null
  meta: Record<string, any> | null
  seed_args: string[] | null
  from_seeds: string[] | null
  created_at: string
  updated_at: string
}

// Bluebook Test Questions (from bluebook_test_questions table)
export interface BluebookTestQuestion {
  id: string
  test_id: string
  subject: string
  test_name: string
  test_date: string | null
  module: string | null
  vip: number
  fetched_at: string | null
  question_type: "choice" | "spr"
  article: string | null
  question: string | null
  options: Array<{
    name: string
    content: string
  }> | null
  correct_answer: string | null
  spr_answers: string[] | null
  solution: string | null
  question_order: number | null
  created_at: string
  updated_at: string
}

// Legacy types for backward compatibility
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
