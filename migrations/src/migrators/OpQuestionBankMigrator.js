import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from '../utils/database.js';
import { logger } from '../utils/logger.js';
import { ProgressTracker } from '../utils/progress.js';
import { config } from '../utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class OpQuestionBankMigrator {
    constructor() {
        this.tableName = 'op_question_bank';
        this.columns = [
            'question_id', 'question_url', 'uuid', 'source', 'difficulty',
            'source_order', 'primary_class', 'skill', 'module', 'answer_type',
            'stem_text', 'stem_html', 'answer_choices', 'correct_choice_letter',
            'spr_answers', 'explanation_text', 'explanation_html',
            'stimulus_text', 'stimulus_html', 'meta', 'seed_args', 'from_seeds'
        ];
    }

    async migrateCollegeBoard() {
        logger.info('🚀 Starting College Board Question Bank migration...');

        try {
            const filePath = join(__dirname, '../../..', config.files.onePrep);
            logger.info(`Reading College Board file: ${filePath}`);

            const fileContent = readFileSync(filePath, 'utf8');
            const data = JSON.parse(fileContent);

            logger.info(`Parsed College Board JSON with ${data.questions?.length || 0} questions`);

            const questions = this.transformCollegeBoardData(data);
            logger.info(`Transformed ${questions.length} College Board questions`);

            if (questions.length === 0) {
                logger.warn('No College Board questions to migrate');
                return 0;
            }

            const progress = new ProgressTracker(questions.length, 'College Board Questions');

            const inserted = await db.batchInsert(
                this.tableName,
                this.columns,
                questions,
                config.migration.batchSize
            );

            progress.complete();

            const totalCount = await db.getTableCount(this.tableName);
            logger.info(`✅ College Board migration complete. Total questions in database: ${totalCount}`);

            return inserted;

        } catch (error) {
            logger.error('❌ College Board Question Bank migration failed:', error);
            throw error;
        }
    }

    async migratePrincetonReview() {
        logger.info('🚀 Starting Princeton Review migration...');

        try {
            const filePath = join(__dirname, '../../..', config.files.princeton);
            logger.info(`Reading Princeton Review file: ${filePath}`);

            const fileContent = readFileSync(filePath, 'utf8');
            const data = JSON.parse(fileContent);

            logger.info(`Parsed Princeton Review JSON with ${data.length || 0} questions`);

            const questions = this.transformPrincetonData(data);
            logger.info(`Transformed ${questions.length} Princeton Review questions`);

            if (questions.length === 0) {
                logger.warn('No Princeton Review questions to migrate');
                return 0;
            }

            const progress = new ProgressTracker(questions.length, 'Princeton Review Questions');

            const inserted = await db.batchInsert(
                this.tableName,
                this.columns,
                questions,
                config.migration.batchSize
            );

            progress.complete();

            const totalCount = await db.getTableCount(this.tableName);
            logger.info(`✅ Princeton Review migration complete. Total questions in database: ${totalCount}`);

            return inserted;

        } catch (error) {
            logger.error('❌ Princeton Review migration failed:', error);
            throw error;
        }
    }

    transformCollegeBoardData(data) {
        const questions = [];

        if (!data.questions || !Array.isArray(data.questions)) {
            logger.error('Invalid College Board data structure: missing questions array');
            return questions;
        }

        for (const question of data.questions) {
            try {
                const transformedQuestion = this.transformCollegeBoardQuestion(question);
                if (transformedQuestion) {
                    questions.push(transformedQuestion);
                }
            } catch (error) {
                logger.error(`Failed to transform College Board question ${question.question_id}:`, error);
            }
        }

        return questions;
    }

    transformCollegeBoardQuestion(question) {
        if (!question.question_id || !question.answer_type) {
            logger.warn(`Skipping College Board question with missing required fields`);
            return null;
        }

        // Transform answer choices for MCQ questions
        let answerChoices = null;
        let correctChoiceLetter = null;

        if (question.answer_type === 'mcq' && question.answer_choices) {
            answerChoices = question.answer_choices.map(choice => ({
                id: choice.id,
                text: choice.text || '',
                letter: choice.letter,
                order: choice.order || 0,
                is_correct: Boolean(choice.is_correct),
                explanation: choice.explanation || ''
            }));

            // Find correct choice letter
            const correctChoice = question.answer_choices.find(c => c.is_correct);
            correctChoiceLetter = correctChoice?.letter || null;
        }

        // Handle SPR answers
        let sprAnswers = null;
        if (question.answer_type === 'spr' && question.spr_answers) {
            sprAnswers = Array.isArray(question.spr_answers) ? question.spr_answers : [];
        }

        // Extract classification from seed args
        const { primaryClass, skill, module } = this.parseCollegeBoardClassification(question);

        return [
            question.question_id,
            question.question_url || null,
            question.uuid || null,
            'collegeboard', // source
            question.difficulty || null,
            question.source_order || null,
            primaryClass,
            skill,
            module,
            question.answer_type,
            question.stem_text || '',
            question.stem_html || '',
            answerChoices ? JSON.stringify(answerChoices) : null,
            correctChoiceLetter,
            sprAnswers ? JSON.stringify(sprAnswers) : null,
            question.explanation_text || '',
            question.explanation_html || '',
            null, // stimulus_text (College Board doesn't use this)
            null, // stimulus_html (College Board doesn't use this)
            null, // meta (College Board doesn't use this format)
            question.seed_args ? JSON.stringify(question.seed_args) : null,
            question.from_seeds ? JSON.stringify(question.from_seeds) : null
        ];
    }

    parseCollegeBoardClassification(question) {
        let primaryClass = null;
        let skill = null;
        let module = null;

        // Extract from seed_args if available
        if (question.seed_args && Array.isArray(question.seed_args)) {
            for (const arg of question.seed_args) {
                if (typeof arg === 'string') {
                    if (arg.includes('primary_class=')) {
                        primaryClass = arg.split('primary_class=')[1]?.split('&')[0];
                    }
                    if (arg.includes('skill=')) {
                        skill = arg.split('skill=')[1]?.split('&')[0];
                    }
                    if (arg.includes('module=')) {
                        module = arg.split('module=')[1]?.split('&')[0];
                    }
                }
            }
        }

        // Extract from from_seeds if seed_args is not available
        if (!primaryClass && question.from_seeds && Array.isArray(question.from_seeds)) {
            for (const seed of question.from_seeds) {
                if (typeof seed === 'string') {
                    if (seed.includes('primary_class=')) {
                        primaryClass = seed.split('primary_class=')[1]?.split('&')[0];
                    }
                    if (seed.includes('skill=')) {
                        skill = seed.split('skill=')[1]?.split('&')[0];
                    }
                    if (seed.includes('module=')) {
                        module = seed.split('module=')[1]?.split('&')[0];
                    }
                }
            }
        }

        return { primaryClass, skill, module };
    }

    transformPrincetonData(data) {
        const questions = [];

        if (!Array.isArray(data)) {
            logger.error('Invalid Princeton Review data structure: expected array');
            return questions;
        }

        for (const question of data) {
            try {
                const transformedQuestion = this.transformPrincetonQuestion(question);
                if (transformedQuestion) {
                    questions.push(transformedQuestion);
                }
            } catch (error) {
                logger.error(`Failed to transform Princeton question ${question.id}:`, error);
            }
        }

        return questions;
    }

    transformPrincetonQuestion(question) {
        if (!question.id || !question.page_data?.answer_type) {
            logger.warn(`Skipping Princeton question with missing required fields`);
            return null;
        }

        const pageData = question.page_data;
        const specs = question.specs || {};
        const meta = question.meta || {};

        // Transform answer choices for MCQ questions
        let answerChoices = null;
        let correctChoiceLetter = null;

        if (pageData.answer_type === 'mcq' && pageData.answer_choices) {
            answerChoices = pageData.answer_choices.map(choice => ({
                id: choice.id,
                text: choice.text || '',
                letter: choice.letter,
                order: choice.order || 0,
                is_correct: Boolean(choice.is_correct),
                explanation: '' // Princeton Review doesn't provide per-choice explanations
            }));

            // Find correct choice letter
            const correctChoice = pageData.answer_choices.find(c => c.is_correct);
            correctChoiceLetter = correctChoice?.letter || null;
        }

        // Handle SPR answers (if any)
        let sprAnswers = null;
        if (pageData.answer_type === 'spr' && pageData.spr_answers) {
            sprAnswers = Array.isArray(pageData.spr_answers) ? pageData.spr_answers : [];
        }

        // Map Princeton Review difficulty to standard format
        const difficulty = this.mapPrincetonDifficulty(meta.difficulty);

        // Map Princeton Review module to standard format
        const module = this.mapPrincetonModule(meta.section);

        return [
            question.id, // question_id
            question.url || null,
            null, // uuid (Princeton doesn't provide)
            'princeton', // source
            difficulty,
            null, // source_order
            meta.domain || null, // primary_class (use domain)
            meta.skill || null,
            module,
            pageData.answer_type,
            specs.stem_text || '',
            specs.stem_html || '',
            answerChoices ? JSON.stringify(answerChoices) : null,
            correctChoiceLetter,
            sprAnswers ? JSON.stringify(sprAnswers) : null,
            null, // explanation_text (Princeton doesn't provide detailed explanations)
            null, // explanation_html
            specs.stimulus_text || null,
            specs.stimulus_html || null,
            JSON.stringify(meta), // Store Princeton meta data
            null, // seed_args (Princeton doesn't use)
            null  // from_seeds (Princeton doesn't use)
        ];
    }

    mapPrincetonDifficulty(difficulty) {
        if (!difficulty) return null;

        const difficultyMap = {
            'Easy': 'E',
            'Medium': 'M',
            'Hard': 'H',
            'easy': 'E',
            'medium': 'M',
            'hard': 'H'
        };

        return difficultyMap[difficulty] || difficulty;
    }

    mapPrincetonModule(section) {
        if (!section) return null;

        const sectionMap = {
            'English': 'en',
            'Math': 'math',
            'Reading': 'en',
            'Writing': 'en'
        };

        return sectionMap[section] || section.toLowerCase();
    }

    async getStats() {
        try {
            const result = await db.query(`
        SELECT 
          source,
          module,
          answer_type,
          difficulty,
          COUNT(*) as count
        FROM ${this.tableName}
        GROUP BY source, module, answer_type, difficulty
        ORDER BY source, module, answer_type, difficulty
      `);

            return result.rows;
        } catch (error) {
            logger.error('Failed to get stats:', error);
            return [];
        }
    }
}
