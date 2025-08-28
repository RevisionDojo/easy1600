import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from '../utils/database.js';
import { logger } from '../utils/logger.js';
import { ProgressTracker } from '../utils/progress.js';
import { config } from '../utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class OfficialPracticeMigrator {
    constructor() {
        this.tableName = 'official_practice_questions';
        this.columns = [
            'question_id', 'exam_id', 'exam_name', 'answer_type',
            'stem_text', 'stem_html', 'explanation_text', 'explanation_html',
            'choices', 'spr_answers', 'meta', 'subject', 'module', 'difficulty',
            'scraped_at', 'first_question_id', 'questions_count'
        ];
    }

    async migrate() {
        logger.info('🚀 Starting Official Practice Questions migration...');

        try {
            // Read and parse the JSON file
            const filePath = join(__dirname, '../../..', config.files.allExams);
            logger.info(`Reading file: ${filePath}`);

            const fileContent = readFileSync(filePath, 'utf8');
            const data = JSON.parse(fileContent);

            logger.info(`Parsed JSON with ${data.exams?.length || 0} exams`);
            logger.info(`Scraped at: ${data.scraped_at}`);

            // Transform data
            const questions = this.transformData(data);
            logger.info(`Transformed ${questions.length} questions`);

            if (questions.length === 0) {
                logger.warn('No questions to migrate');
                return 0;
            }

            // Insert data in batches
            const progress = new ProgressTracker(questions.length, 'Official Practice Questions');

            const inserted = await db.batchInsert(
                this.tableName,
                this.columns,
                questions,
                config.migration.batchSize
            );

            progress.complete();

            // Verify insertion
            const totalCount = await db.getTableCount(this.tableName);
            logger.info(`✅ Migration complete. Total questions in database: ${totalCount}`);

            return inserted;

        } catch (error) {
            logger.error('❌ Official Practice Questions migration failed:', error);
            throw error;
        }
    }

    transformData(data) {
        const questions = [];
        const scrapedAt = data.scraped_at ? new Date(data.scraped_at) : new Date();

        if (!data.exams || !Array.isArray(data.exams)) {
            logger.error('Invalid data structure: missing exams array');
            return questions;
        }

        for (const exam of data.exams) {
            if (!exam.questions || !Array.isArray(exam.questions)) {
                logger.warn(`Exam ${exam.exam_id} has no questions array`);
                continue;
            }

            // Extract subject and module from exam name
            const { subject, module } = this.parseExamName(exam.name);

            for (const question of exam.questions) {
                try {
                    const transformedQuestion = this.transformQuestion(
                        question,
                        exam,
                        subject,
                        module,
                        scrapedAt
                    );

                    if (transformedQuestion) {
                        questions.push(transformedQuestion);
                    }
                } catch (error) {
                    logger.error(`Failed to transform question ${question.question_id}:`, error);
                    // Continue with other questions
                }
            }
        }

        return questions;
    }

    transformQuestion(question, exam, subject, module, scrapedAt) {
        // Validate required fields
        if (!question.question_id || !question.answer_type) {
            logger.warn(`Skipping question with missing required fields: ${JSON.stringify(question, null, 2).substring(0, 200)}`);
            return null;
        }

        // Clean and validate choices for MCQ questions
        let choices = null;
        if (question.answer_type === 'mcq' && question.choices) {
            choices = question.choices.map(choice => ({
                id: choice.id,
                letter: choice.letter,
                html: choice.html || '',
                text: choice.text || '',
                is_correct: Boolean(choice.is_correct)
            }));
        }

        // Handle SPR answers
        let sprAnswers = null;
        if (question.answer_type === 'spr' && question.spr_answers) {
            sprAnswers = Array.isArray(question.spr_answers) ? question.spr_answers : [];
        }

        // Determine difficulty (can be enhanced based on exam type or other factors)
        const difficulty = this.determineDifficulty(exam.name, question);

        return [
            question.question_id,
            parseInt(exam.exam_id),
            exam.name || '',
            question.answer_type,
            question.stem_text || '',
            question.stem_html || '',
            question.explanation_text || '',
            question.explanation_html || '',
            choices ? JSON.stringify(choices) : null,
            sprAnswers ? JSON.stringify(sprAnswers) : null,
            question.meta ? JSON.stringify(question.meta) : null,
            subject,
            module,
            difficulty,
            scrapedAt,
            parseInt(exam.first_question_id) || null,
            parseInt(exam.questions_count) || null
        ];
    }

    parseExamName(examName) {
        if (!examName) return { subject: null, module: null };

        const name = examName.toLowerCase();

        // Extract subject
        let subject = null;
        if (name.includes('english')) {
            subject = 'english';
        } else if (name.includes('math')) {
            subject = 'math';
        }

        // Extract module
        let module = null;
        if (name.includes('module 1')) {
            module = 'module1';
        } else if (name.includes('module 2')) {
            module = 'module2';
        }

        return { subject, module };
    }

    determineDifficulty(examName, question) {
        // Basic difficulty determination logic
        // Can be enhanced based on question analysis or exam metadata

        if (!examName) return 'medium';

        const name = examName.toLowerCase();

        if (name.includes('practice #1') || name.includes('practice test 1')) {
            return 'easy';
        } else if (name.includes('practice #6') || name.includes('advanced')) {
            return 'hard';
        }

        return 'medium';
    }

    async getStats() {
        try {
            const result = await db.query(`
        SELECT 
          subject,
          module,
          answer_type,
          difficulty,
          COUNT(*) as count
        FROM ${this.tableName}
        GROUP BY subject, module, answer_type, difficulty
        ORDER BY subject, module, answer_type, difficulty
      `);

            return result.rows;
        } catch (error) {
            logger.error('Failed to get stats:', error);
            return [];
        }
    }
}
