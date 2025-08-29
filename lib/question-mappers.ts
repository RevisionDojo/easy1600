import {
    OfficialPracticeQuestion,
    OpQuestionBankQuestion,
    BluebookTestQuestion,
    OnePrepQuestion,
    BlueBookQuestion,
    OnePrepChoice,
    BlueBookOption
} from '@/types/question-types'
import { TopicMappingService } from '@/lib/topic-mapping'

/**
 * Map Official Practice Questions to OnePrep format for components
 */
export function mapOfficialPracticeToOnePrep(question: OfficialPracticeQuestion): OnePrepQuestion {
    return {
        question_id: question.question_id,
        answer_type: question.answer_type,
        stem_text: question.stem_text,
        stem_html: question.stem_html,
        explanation_text: question.explanation_text,
        explanation_html: question.explanation_html,
        choices: question.choices?.map(choice => ({
            id: choice.id,
            letter: choice.letter,
            html: choice.html,
            text: choice.text,
            is_correct: choice.is_correct
        })) || [],
        spr_answers: question.spr_answers || [],
        meta: {
            is_marked_for_review: 0,
            answer_choices_status: question.meta || {}
        }
    }
}

/**
 * Map OP Question Bank to OnePrep format for components
 */
export function mapOpQuestionBankToOnePrep(question: OpQuestionBankQuestion): OnePrepQuestion {
    return {
        question_id: question.question_id,
        answer_type: question.answer_type,
        stem_text: question.stem_text || '',
        stem_html: question.stem_html || '',
        explanation_text: question.explanation_text || '',
        explanation_html: question.explanation_html || '',
        choices: question.answer_choices?.map(choice => ({
            id: choice.id,
            letter: choice.letter,
            html: choice.html || `<p>${choice.text}</p>`,
            text: choice.text,
            is_correct: choice.is_correct
        })) || [],
        spr_answers: question.spr_answers || [],
        meta: {
            is_marked_for_review: 0,
            answer_choices_status: {}
        }
    }
}

/**
 * Map Bluebook Test Questions to BlueBook format for components
 */
export function mapBluebookToBlueBook(question: BluebookTestQuestion): BlueBookQuestion {
    return {
        type: question.question_type === 'choice' ? 'choice' : 'write',
        article: question.article || '',
        question: question.question || '',
        options: question.options?.map(option => ({
            name: option.name,
            content: option.content
        })) || [],
        correct: question.correct_answer || '',
        solution: question.solution || ''
    }
}

/**
 * Enhanced question interface with metadata for display
 */
export interface EnhancedQuestion {
    // Core question data
    question: OnePrepQuestion | BlueBookQuestion
    format: 'oneprep' | 'bluebook'

    // Metadata for display and filtering
    metadata: {
        id: string
        source: 'official_practice' | 'princeton' | 'collegeboard' | 'bluebook'
        difficulty?: string
        module?: string
        primaryClass?: string
        skill?: string
        subject?: string
        testName?: string
        questionOrder?: number
        // Enhanced topic information
        topicInfo?: {
            subject: string
            topic: string
            subtopic: string
            description?: string
            topicDescription?: string
        }
    }
}

/**
 * Map Official Practice Question to Enhanced Question
 */
export function mapOfficialPracticeToEnhanced(question: OfficialPracticeQuestion): EnhancedQuestion {
    return {
        question: mapOfficialPracticeToOnePrep(question),
        format: 'oneprep',
        metadata: {
            id: question.id,
            source: 'official_practice',
            // Official practice questions don't have difficulty/classification in our current schema
        }
    }
}

/**
 * Map Princeton Question to Enhanced Question
 */
export function mapPrincetonToEnhanced(question: OpQuestionBankQuestion): EnhancedQuestion {
    const topicInfo = TopicMappingService.getPrincetonTopic(question.meta)

    return {
        question: mapOpQuestionBankToOnePrep(question),
        format: 'oneprep',
        metadata: {
            id: question.id,
            source: 'princeton',
            difficulty: question.difficulty || undefined,
            module: question.module || undefined,
            primaryClass: question.primary_class || undefined,
            skill: question.skill || undefined,
            topicInfo
        }
    }
}

/**
 * Map College Board Question to Enhanced Question
 */
export function mapCollegeBoardToEnhanced(question: OpQuestionBankQuestion): EnhancedQuestion {
    const topicInfo = question.module && question.primary_class && question.skill
        ? TopicMappingService.getCollegeBoardTopic(question.module, question.primary_class, question.skill)
        : null

    return {
        question: mapOpQuestionBankToOnePrep(question),
        format: 'oneprep',
        metadata: {
            id: question.id,
            source: 'collegeboard',
            difficulty: question.difficulty || undefined,
            module: question.module || undefined,
            primaryClass: question.primary_class || undefined,
            skill: question.skill || undefined,
            topicInfo
        }
    }
}

/**
 * Map Bluebook Question to Enhanced Question
 */
export function mapBluebookToEnhanced(question: BluebookTestQuestion): EnhancedQuestion {
    return {
        question: mapBluebookToBlueBook(question),
        format: 'bluebook',
        metadata: {
            id: question.id,
            source: 'bluebook',
            subject: question.subject,
            testName: question.test_name,
            questionOrder: question.question_order || undefined
        }
    }
}

/**
 * Utility function to get display name for source
 */
export function getSourceDisplayName(source: string): string {
    switch (source) {
        case 'official_practice':
            return 'SAT Suite (Official Practice)'
        case 'princeton':
            return 'Princeton Review'
        case 'collegeboard':
            return 'College Board (Leaked)'
        case 'bluebook':
            return 'Bluebook (Official Tests)'
        default:
            return source
    }
}

/**
 * Utility function to get difficulty badge color
 */
export function getDifficultyColor(difficulty: string): string {
    switch (difficulty?.toLowerCase()) {
        case 'e':
        case 'easy':
            return 'bg-green-100 text-green-800'
        case 'm':
        case 'medium':
            return 'bg-yellow-100 text-yellow-800'
        case 'h':
        case 'hard':
            return 'bg-red-100 text-red-800'
        default:
            return 'bg-gray-100 text-gray-800'
    }
}
