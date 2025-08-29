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
    // Enhanced topic filtering
    topics?: string[] // For Princeton Review domains
    subtopics?: string[] // For Princeton Review skills
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
     * Get Official Practice Questions (SAT Suite) - for /official-exams
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

            // Enhanced topic filtering for Princeton
            if (filters.topics?.length) {
                // Filter by domain in meta field
                const topicConditions = filters.topics.map(topic => `meta->>'domain'.ilike.%${topic}%`).join(',')
                query = query.or(topicConditions)
            }

            if (filters.subtopics?.length) {
                // Filter by skill in meta field
                const subtopicConditions = filters.subtopics.map(subtopic => `meta->>'skill'.ilike.%${subtopic}%`).join(',')
                query = query.or(subtopicConditions)
            }

            if (filters.search) {
                query = query.or(`stem_text.ilike.%${filters.search}%,stem_html.ilike.%${filters.search}%,stimulus_text.ilike.%${filters.search}%,meta->>'domain'.ilike.%${filters.search}%,meta->>'skill'.ilike.%${filters.search}%`)
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
     * Get College Board Questions - for /question-bank
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
    static async getBluebookTestById(testName: string, subject?: string): Promise<PaginatedResponse<BluebookTestQuestion>> {
        try {
            let query = supabase
                .from('bluebook_test_questions')
                .select('*', { count: 'exact' })
                .eq('test_name', testName)

            // Filter by subject if specified
            if (subject) {
                query = query.eq('subject', subject)
            }

            query = query.order('question_order', { nullsLast: true })

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
     * Get questions for a complete exam (both Math and English)
     */
    static async getBluebookCompleteExam(examBaseName: string): Promise<PaginatedResponse<BluebookTestQuestion>> {
        try {
            const { data, error, count } = await supabase
                .from('bluebook_test_questions')
                .select('*', { count: 'exact' })
                .or(`test_name.eq.${examBaseName},test_name.eq.${examBaseName} - English,test_name.eq.${examBaseName} - Math,test_name.ilike.${examBaseName}%`)
                .order('subject') // English first, then Math
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
     * Get Official Practice Exam Summaries - optimized using minimal queries
     */
    static async getOfficialPracticeExamSummaries(): Promise<{ exams: any[], error: string | null }> {
        try {
            // Much simpler approach: Use the existing efficient method but with minimal data
            // Since each test has ~145 questions and we know the structure, we can paginate smartly

            let allExamData = []
            let offset = 0
            const pageSize = 1000
            let hasMore = true

            while (hasMore) {
                const { data, error } = await supabase
                    .from('official_practice_questions')
                    .select('exam_name, answer_type')
                    .range(offset, offset + pageSize - 1)
                    .order('exam_name')

                if (error) {
                    return { exams: [], error: error.message }
                }

                if (data.length === 0) {
                    hasMore = false
                } else {
                    allExamData.push(...data)
                    offset += pageSize

                    if (data.length < pageSize) {
                        hasMore = false
                    }
                }
            }

            console.log(`Loaded ${allExamData.length} question records for grouping`)

            // Group by base test name
            const examGroups: Record<string, any> = {}

            allExamData.forEach(question => {
                const fullExamName = question.exam_name
                if (!fullExamName) return

                // Extract base test name (keep "Bluebook" prefix)
                const baseTestName = fullExamName
                    .replace(/ - English.*$/, '')
                    .replace(/ - Math.*$/, '')
                    .replace(/ - Module.*$/, '')
                    .trim()

                // Extract module info
                const name = fullExamName.toLowerCase()
                let subject = 'unknown'
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

                if (!examGroups[baseTestName]) {
                    examGroups[baseTestName] = {
                        examName: baseTestName,
                        modules: [],
                        totalQuestions: 0,
                        totalMcq: 0,
                        totalSpr: 0
                    }
                }

                const exam = examGroups[baseTestName]

                // Find or create module entry
                let moduleEntry = exam.modules.find((m: any) => m.moduleName === fullExamName)
                if (!moduleEntry) {
                    moduleEntry = {
                        moduleName: fullExamName,
                        subject,
                        module,
                        questionCount: 0
                    }
                    exam.modules.push(moduleEntry)
                }

                // Update counts
                moduleEntry.questionCount++
                exam.totalQuestions++

                if (question.answer_type === 'mcq') {
                    exam.totalMcq++
                } else if (question.answer_type === 'spr') {
                    exam.totalSpr++
                }
            })

            const finalExams = Object.values(examGroups)
                .filter((exam: any) => exam.totalQuestions > 0 && exam.modules.length > 0)
                .map((exam: any) => {
                    // Fix unknown modules based on position
                    const sortedModules = exam.modules.sort((a: any, b: any) => {
                        if (a.subject !== b.subject) {
                            return a.subject === 'English' ? -1 : 1
                        }
                        return a.moduleName.localeCompare(b.moduleName)
                    })

                    // Assign proper module names for unknown modules
                    const englishModules = sortedModules.filter((m: any) => m.subject === 'English')
                    const mathModules = sortedModules.filter((m: any) => m.subject === 'Math')

                    englishModules.forEach((mod: any, index: number) => {
                        if (mod.module === 'Module 1' && index === 0) {
                            mod.module = 'Module 1'
                        } else if (index === 1) {
                            mod.module = englishModules.length === 2 ? 'Module 2' : 'Module 2 (Easy)'
                        } else if (index === 2) {
                            mod.module = 'Module 2 (Hard)'
                        }
                    })

                    mathModules.forEach((mod: any, index: number) => {
                        if (mod.module === 'Module 1' && index === 0) {
                            mod.module = 'Module 1'
                        } else if (index === 1) {
                            mod.module = mathModules.length === 2 ? 'Module 2' : 'Module 2 (Easy)'
                        } else if (index === 2) {
                            mod.module = 'Module 2 (Hard)'
                        }
                    })

                    return {
                        ...exam,
                        modules: [...englishModules, ...mathModules] // English first, then Math
                    }
                })
                .sort((a: any, b: any) => {
                    // Sort by closeness to 147 questions (ideal complete test)
                    const aDiff = Math.abs(a.totalQuestions - 147)
                    const bDiff = Math.abs(b.totalQuestions - 147)

                    if (aDiff !== bDiff) {
                        return aDiff - bDiff // Closer to 147 comes first
                    }

                    // If equal distance from 147, prefer higher question count
                    return b.totalQuestions - a.totalQuestions
                })

            return { exams: finalExams, error: null }
        } catch (err) {
            return {
                exams: [],
                error: err instanceof Error ? err.message : 'Unknown error'
            }
        }
    }

    /**
     * Get questions for a specific Official Practice exam (by exact module name)
     */
    static async getOfficialPracticeExamById(examName: string): Promise<PaginatedResponse<OfficialPracticeQuestion>> {
        try {
            let query = supabase
                .from('official_practice_questions')
                .select('*', { count: 'exact' })
                .eq('exam_name', examName)

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
     * Get questions for a complete Official Practice test (by base test name)
     */
    static async getOfficialPracticeCompleteExam(baseTestName: string): Promise<PaginatedResponse<OfficialPracticeQuestion>> {
        try {
            // Search for all modules that belong to this test
            // e.g., baseTestName "Bluebook - SAT Practice #1" should match:
            // "Bluebook - SAT Practice #1 - English - Module 1", etc.
            const { data, error, count } = await supabase
                .from('official_practice_questions')
                .select('*', { count: 'exact' })
                .ilike('exam_name', `%${baseTestName}%`)
                .order('exam_name') // Order by module name for consistent grouping
                .order('question_id')

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
