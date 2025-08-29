import { supabase } from '@/lib/supabase'
import {
    OfficialPracticeQuestion,
    OpQuestionBankQuestion,
    BluebookTestQuestion
} from '@/types/question-types'

export interface QuestionFilters {
    difficulty?: string[]
    module?: string[]
    primaryClass?: string[]
    skill?: string[]
    answerType?: ('mcq' | 'spr')[]
    subject?: string[]
    search?: string
    limit?: number
    offset?: number
}

export interface PaginatedResponse<T> {
    data: T[]
    count: number | null
    error: string | null
}

/**
 * Data service for fetching SAT questions from Supabase
 */
export class SATDataService {

    /**
     * Get Official Practice Questions (SAT Suite) - for /question-bank
     */
    static async getOfficialPracticeQuestions(
        filters: QuestionFilters = {}
    ): Promise<PaginatedResponse<OfficialPracticeQuestion>> {
        try {
            let query = supabase
                .from('official_practice_questions')
                .select('*', { count: 'exact' })

            // Apply filters
            if (filters.answerType?.length) {
                query = query.in('answer_type', filters.answerType)
            }

            if (filters.search) {
                query = query.or(`stem_text.ilike.%${filters.search}%,stem_html.ilike.%${filters.search}%,explanation_text.ilike.%${filters.search}%`)
            }

            // Pagination
            if (filters.offset) {
                query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)
            } else if (filters.limit) {
                query = query.limit(filters.limit)
            }

            // Order by question_id for consistency
            query = query.order('question_id')

            const { data, error, count } = await query

            return {
                data: data || [],
                count,
                error: error?.message || null
            }
        } catch (err) {
            return {
                data: [],
                count: null,
                error: err instanceof Error ? err.message : 'Unknown error'
            }
        }
    }

    /**
     * Get Princeton Review Questions - for /question-bank
     */
    static async getPrincetonQuestions(
        filters: QuestionFilters = {}
    ): Promise<PaginatedResponse<OpQuestionBankQuestion>> {
        try {
            let query = supabase
                .from('op_question_bank')
                .select('*', { count: 'exact' })
                .eq('source', 'princeton')

            // Apply filters
            if (filters.difficulty?.length) {
                query = query.in('difficulty', filters.difficulty)
            }

            if (filters.module?.length) {
                query = query.in('module', filters.module)
            }

            if (filters.primaryClass?.length) {
                query = query.in('primary_class', filters.primaryClass)
            }

            if (filters.skill?.length) {
                query = query.in('skill', filters.skill)
            }

            if (filters.answerType?.length) {
                query = query.in('answer_type', filters.answerType)
            }

            if (filters.search) {
                query = query.or(`stem_text.ilike.%${filters.search}%,stem_html.ilike.%${filters.search}%,stimulus_text.ilike.%${filters.search}%`)
            }

            // Pagination
            if (filters.offset) {
                query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)
            } else if (filters.limit) {
                query = query.limit(filters.limit)
            }

            // Order by question_id for consistency
            query = query.order('question_id')

            const { data, error, count } = await query

            return {
                data: data || [],
                count,
                error: error?.message || null
            }
        } catch (err) {
            return {
                data: [],
                count: null,
                error: err instanceof Error ? err.message : 'Unknown error'
            }
        }
    }

    /**
     * Get College Board Questions - for /leaked-exams
     */
    static async getCollegeBoardQuestions(
        filters: QuestionFilters = {}
    ): Promise<PaginatedResponse<OpQuestionBankQuestion>> {
        try {
            let query = supabase
                .from('op_question_bank')
                .select('*', { count: 'exact' })
                .eq('source', 'collegeboard')

            // Apply filters (same as Princeton but for College Board)
            if (filters.difficulty?.length) {
                query = query.in('difficulty', filters.difficulty)
            }

            if (filters.module?.length) {
                query = query.in('module', filters.module)
            }

            if (filters.primaryClass?.length) {
                query = query.in('primary_class', filters.primaryClass)
            }

            if (filters.skill?.length) {
                query = query.in('skill', filters.skill)
            }

            if (filters.answerType?.length) {
                query = query.in('answer_type', filters.answerType)
            }

            if (filters.search) {
                query = query.or(`stem_text.ilike.%${filters.search}%,stem_html.ilike.%${filters.search}%`)
            }

            // Pagination
            if (filters.offset) {
                query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)
            } else if (filters.limit) {
                query = query.limit(filters.limit)
            }

            // Order by question_id for consistency
            query = query.order('question_id')

            const { data, error, count } = await query

            return {
                data: data || [],
                count,
                error: error?.message || null
            }
        } catch (err) {
            return {
                data: [],
                count: null,
                error: err instanceof Error ? err.message : 'Unknown error'
            }
        }
    }

    /**
     * Get Bluebook Test Questions - for /official-exams
     */
    static async getBluebookQuestions(
        filters: QuestionFilters = {}
    ): Promise<PaginatedResponse<BluebookTestQuestion>> {
        try {
            let query = supabase
                .from('bluebook_test_questions')
                .select('*', { count: 'exact' })

            // Apply filters
            if (filters.subject?.length) {
                query = query.in('subject', filters.subject)
            }

            if (filters.answerType?.length) {
                // Map mcq/spr to choice/spr for bluebook
                const mappedTypes = filters.answerType.map(type => type === 'mcq' ? 'choice' : type)
                query = query.in('question_type', mappedTypes)
            }

            if (filters.search) {
                query = query.or(`article.ilike.%${filters.search}%,question.ilike.%${filters.search}%,solution.ilike.%${filters.search}%`)
            }

            // Pagination
            if (filters.offset) {
                query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)
            } else if (filters.limit) {
                query = query.limit(filters.limit)
            }

            // Order by test_name and question_order for logical grouping
            query = query.order('test_name').order('question_order', { nullsLast: true })

            const { data, error, count } = await query

            return {
                data: data || [],
                count,
                error: error?.message || null
            }
        } catch (err) {
            return {
                data: [],
                count: null,
                error: err instanceof Error ? err.message : 'Unknown error'
            }
        }
    }

    /**
     * Get unique test names from Bluebook data
     */
    static async getBluebookTestNames(): Promise<{ test_names: string[], error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('bluebook_test_questions')
                .select('test_name')
                .order('test_name')

            if (error) {
                return { test_names: [], error: error.message }
            }

            const uniqueTestNames = [...new Set(data?.map(item => item.test_name) || [])]
            return { test_names: uniqueTestNames, error: null }
        } catch (err) {
            return {
                test_names: [],
                error: err instanceof Error ? err.message : 'Unknown error'
            }
        }
    }

    /**
     * Get questions for a specific Bluebook test
     */
    static async getBluebookTestById(testName: string): Promise<PaginatedResponse<BluebookTestQuestion>> {
        try {
            const { data, error, count } = await supabase
                .from('bluebook_test_questions')
                .select('*', { count: 'exact' })
                .eq('test_name', testName)
                .order('question_order', { nullsLast: true })

            return {
                data: data || [],
                count,
                error: error?.message || null
            }
        } catch (err) {
            return {
                data: [],
                count: null,
                error: err instanceof Error ? err.message : 'Unknown error'
            }
        }
    }

    /**
     * Get filter options for each data source
     */
    static async getFilterOptions() {
        try {
            // Get College Board/Princeton filter options
            const { data: opData } = await supabase
                .from('op_question_bank')
                .select('difficulty, module, primary_class, skill, source')

            // Get Bluebook filter options  
            const { data: bluebookData } = await supabase
                .from('bluebook_test_questions')
                .select('subject, test_name')

            const collegeBoardData = opData?.filter(item => item.source === 'collegeboard') || []
            const princetonData = opData?.filter(item => item.source === 'princeton') || []

            return {
                collegeboard: {
                    difficulties: [...new Set(collegeBoardData.map(item => item.difficulty).filter(Boolean))],
                    modules: [...new Set(collegeBoardData.map(item => item.module).filter(Boolean))],
                    primaryClasses: [...new Set(collegeBoardData.map(item => item.primary_class).filter(Boolean))],
                    skills: [...new Set(collegeBoardData.map(item => item.skill).filter(Boolean))]
                },
                princeton: {
                    difficulties: [...new Set(princetonData.map(item => item.difficulty).filter(Boolean))],
                    modules: [...new Set(princetonData.map(item => item.module).filter(Boolean))],
                    primaryClasses: [...new Set(princetonData.map(item => item.primary_class).filter(Boolean))],
                    skills: [...new Set(princetonData.map(item => item.skill).filter(Boolean))]
                },
                bluebook: {
                    subjects: [...new Set(bluebookData?.map(item => item.subject).filter(Boolean) || [])],
                    testNames: [...new Set(bluebookData?.map(item => item.test_name).filter(Boolean) || [])]
                }
            }
        } catch (err) {
            console.error('Error fetching filter options:', err)
            return {
                collegeboard: { difficulties: [], modules: [], primaryClasses: [], skills: [] },
                princeton: { difficulties: [], modules: [], primaryClasses: [], skills: [] },
                bluebook: { subjects: [], testNames: [] }
            }
        }
    }
}
