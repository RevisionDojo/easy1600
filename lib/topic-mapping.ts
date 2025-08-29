/**
 * Topic mapping and classification service for SAT questions
 * Handles conversion between coded classifications and human-readable topics
 */

// College Board classification mapping
export const COLLEGE_BOARD_MAPPING = {
    // English Classifications
    en: {
        name: 'English',
        classes: {
            CAS: {
                name: 'Command of Authorial Style',
                description: 'Understanding how authors use language to achieve specific effects',
                skills: {
                    WIC: { name: 'Words in Context', description: 'Understanding word meanings in context' },
                    TSP: { name: 'Text Structure and Purpose', description: 'Analyzing text organization and purpose' },
                    CTC: { name: 'Cross-Text Connections', description: 'Making connections across texts' }
                }
            },
            INI: {
                name: 'Information and Ideas',
                description: 'Comprehending and analyzing informational content',
                skills: {
                    INF: { name: 'Inferences', description: 'Drawing logical conclusions from text' },
                    CID: { name: 'Central Ideas and Details', description: 'Identifying main ideas and supporting details' },
                    COE: { name: 'Command of Evidence', description: 'Using evidence to support claims' }
                }
            },
            EOI: {
                name: 'Expression of Ideas',
                description: 'Effective communication and rhetorical skills',
                skills: {
                    TRA: { name: 'Transitions', description: 'Using appropriate transitions between ideas' },
                    SYN: { name: 'Rhetorical Synthesis', description: 'Synthesizing information effectively' }
                }
            },
            SEC: {
                name: 'Standard English Conventions',
                description: 'Grammar, usage, and mechanics',
                skills: {
                    BOU: { name: 'Boundaries', description: 'Sentence boundaries and structure' },
                    FSS: { name: 'Form, Structure, and Sense', description: 'Grammar and sentence construction' }
                }
            }
        }
    },

    // Math Classifications
    math: {
        name: 'Math',
        classes: {
            P: {
                name: 'Problem-Solving and Data Analysis',
                description: 'Quantitative reasoning and data interpretation',
                skills: {
                    'P.A.': { name: 'Ratios, Rates, and Proportional Relationships', description: 'Working with proportional reasoning' },
                    'P.B.': { name: 'Percentages', description: 'Percentage calculations and applications' },
                    'P.C.': { name: 'One-Variable Data', description: 'Analyzing single-variable data sets' }
                }
            },
            Q: {
                name: 'Algebra',
                description: 'Linear and nonlinear algebraic concepts',
                skills: {
                    'Q.A.': { name: 'Linear Equations in One Variable', description: 'Solving linear equations' },
                    'Q.B.': { name: 'Linear Equations in Two Variables', description: 'Systems and graphing' },
                    'Q.C.': { name: 'Linear Functions', description: 'Function analysis and applications' },
                    'Q.D.': { name: 'Linear Inequalities', description: 'Solving and graphing inequalities' },
                    'Q.E.': { name: 'Nonlinear Equations', description: 'Quadratic and other nonlinear equations' }
                }
            },
            S: {
                name: 'Advanced Math',
                description: 'Complex mathematical concepts and relationships',
                skills: {
                    'S.A.': { name: 'Equivalent Expressions', description: 'Algebraic manipulation and factoring' },
                    'S.B.': { name: 'Nonlinear Equations in One Variable', description: 'Advanced equation solving' },
                    'S.C.': { name: 'Nonlinear Functions', description: 'Function analysis and transformations' }
                }
            },
            H: {
                name: 'Geometry and Trigonometry',
                description: 'Spatial reasoning and trigonometric concepts',
                skills: {
                    'H.A.': { name: 'Area and Volume', description: 'Calculating areas and volumes' },
                    'H.B.': { name: 'Lines, Angles, and Triangles', description: 'Basic geometric relationships' },
                    'H.C.': { name: 'Right Triangles and Trigonometry', description: 'Trigonometric ratios and applications' },
                    'H.D.': { name: 'Circles', description: 'Circle properties and equations' },
                    'H.E.': { name: 'Congruence and Similarity', description: 'Geometric transformations and similarity' }
                }
            }
        }
    }
} as const

// Princeton Review uses direct human-readable names, so no mapping needed
export const PRINCETON_TOPICS = {
    Math: {
        'Problem-Solving and Data Analysis': [
            'Working with Data',
            'Proportional Relationships'
        ],
        'Algebra': [
            'Linear Solving',
            'Nonlinear Solving',
            'Representation and Interpretation',
            'Coordinate Geometry',
            'Functions'
        ],
        'Strategies': [
            'Plugging In',
            'Plugging In the Answers'
        ],
        'Geometry and Trigonometry': [
            'Geometry and Trigonometry',
            'Advanced Coordinate Geometry'
        ]
    },
    English: {
        'Reading': [
            'Vocabulary',
            'Purpose',
            'Dual Texts',
            'Retrieval',
            'Main Ideas',
            'Charts',
            'Claims',
            'Conclusions'
        ],
        'Writing Rules': [
            'Pronouns',
            'Complete Sentences',
            'Nouns',
            'Connecting Clauses',
            'Punctuation with Describing Phrases',
            'No Punctuation',
            'Verbs',
            'Modifiers',
            'Lists'
        ],
        'Writing Rhetoric': [
            'Transitions',
            'Rhetorical Synthesis'
        ]
    }
} as const

// Utility functions for topic mapping
export class TopicMappingService {

    /**
     * Get human-readable topic for College Board classification
     */
    static getCollegeBoardTopic(module: string, primaryClass: string, skill: string) {
        const moduleKey = module as keyof typeof COLLEGE_BOARD_MAPPING
        const moduleData = COLLEGE_BOARD_MAPPING[moduleKey]

        if (!moduleData) return null

        const classData = moduleData.classes[primaryClass as keyof typeof moduleData.classes]
        if (!classData) return null

        const skillData = classData.skills[skill as keyof typeof classData.skills]
        if (!skillData) return null

        return {
            subject: moduleData.name,
            topic: classData.name,
            subtopic: skillData.name,
            description: skillData.description,
            topicDescription: classData.description
        }
    }

    /**
     * Get Princeton Review topic structure (already human-readable)
     */
    static getPrincetonTopic(meta: any) {
        if (!meta?.section || !meta?.domain || !meta?.skill) return null

        return {
            subject: meta.section,
            topic: meta.domain,
            subtopic: meta.skill,
            description: `${meta.domain} - ${meta.skill}`,
            topicDescription: meta.domain
        }
    }

    /**
     * Get all available topics for a given source
     */
    static getAllTopics(source: 'collegeboard' | 'princeton' | 'official_practice' | 'bluebook') {
        switch (source) {
            case 'princeton':
                return Object.entries(PRINCETON_TOPICS).map(([subject, topics]) => ({
                    subject,
                    topics: Object.entries(topics).map(([topic, subtopics]) => ({
                        topic,
                        subtopics: subtopics as string[]
                    }))
                }))

            case 'collegeboard':
                return Object.entries(COLLEGE_BOARD_MAPPING).map(([moduleKey, moduleData]) => ({
                    subject: moduleData.name,
                    topics: Object.entries(moduleData.classes).map(([classKey, classData]) => ({
                        topic: classData.name,
                        subtopics: Object.entries(classData.skills).map(([skillKey, skillData]) => skillData.name)
                    }))
                }))

            case 'official_practice':
                return [
                    { subject: 'English', topics: [{ topic: 'General', subtopics: ['All Questions'] }] },
                    { subject: 'Math', topics: [{ topic: 'General', subtopics: ['All Questions'] }] }
                ]

            case 'bluebook':
                return [
                    { subject: 'English', topics: [{ topic: 'General', subtopics: ['All Questions'] }] },
                    { subject: 'Math', topics: [{ topic: 'General', subtopics: ['All Questions'] }] }
                ]

            default:
                return []
        }
    }

    /**
     * Get topic hierarchy for filtering UI
     */
    static getTopicHierarchy() {
        return {
            princeton: this.getAllTopics('princeton'),
            collegeboard: this.getAllTopics('collegeboard'),
            official_practice: this.getAllTopics('official_practice'),
            bluebook: this.getAllTopics('bluebook')
        }
    }

    /**
     * Create search-friendly topic strings
     */
    static createTopicSearchTerms(question: any, source: string) {
        const terms: string[] = []

        switch (source) {
            case 'princeton':
                if (question.meta?.section) terms.push(question.meta.section)
                if (question.meta?.domain) terms.push(question.meta.domain)
                if (question.meta?.skill) terms.push(question.meta.skill)
                break

            case 'collegeboard':
                if (question.module && question.primary_class && question.skill) {
                    const topic = this.getCollegeBoardTopic(question.module, question.primary_class, question.skill)
                    if (topic) {
                        terms.push(topic.subject, topic.topic, topic.subtopic)
                    }
                }
                break

            case 'official_practice':
                if (question.subject) terms.push(question.subject)
                if (question.module) terms.push(question.module)
                break

            case 'bluebook':
                if (question.subject) terms.push(question.subject)
                if (question.test_name) terms.push(question.test_name)
                break
        }

        return terms.join(' ')
    }

    /**
     * Get difficulty display info
     */
    static getDifficultyInfo(difficulty: string | null) {
        if (!difficulty) return null

        const diffMap: Record<string, { name: string, color: string, level: number }> = {
            'E': { name: 'Easy', color: 'bg-green-100 text-green-800', level: 1 },
            'M': { name: 'Medium', color: 'bg-yellow-100 text-yellow-800', level: 2 },
            'H': { name: 'Hard', color: 'bg-red-100 text-red-800', level: 3 },
            'easy': { name: 'Easy', color: 'bg-green-100 text-green-800', level: 1 },
            'medium': { name: 'Medium', color: 'bg-yellow-100 text-yellow-800', level: 2 },
            'hard': { name: 'Hard', color: 'bg-red-100 text-red-800', level: 3 }
        }

        return diffMap[difficulty] || { name: difficulty, color: 'bg-gray-100 text-gray-800', level: 0 }
    }
}
