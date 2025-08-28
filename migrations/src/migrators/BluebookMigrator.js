import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from '../utils/database.js';
import { logger } from '../utils/logger.js';
import { ProgressTracker } from '../utils/progress.js';
import { config } from '../utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class BluebookMigrator {
    constructor() {
        this.tableName = 'bluebook_test_questions';
        this.columns = [
            'test_id', 'subject', 'test_name', 'test_date', 'module', 'vip',
            'fetched_at', 'question_type', 'article', 'question', 'options',
            'correct_answer', 'spr_answers', 'solution', 'question_order'
        ];
    }

    async migrate() {
        logger.info('🚀 Starting Bluebook Tests migration...');

        try {
            // Read the index file to get test metadata
            const indexPath = join(__dirname, '../../..', config.files.bluebookIndex);
            logger.info(`Reading Bluebook index: ${indexPath}`);

            const indexContent = readFileSync(indexPath, 'utf8');
            const indexData = JSON.parse(indexContent);

            logger.info(`Found ${indexData.summary?.totalTests || 0} total tests`);
            logger.info(`Successful tests: ${indexData.summary?.successfulTests || 0}`);

            // Process all test files
            const allQuestions = [];
            const bluebookDir = join(__dirname, '../../..', config.files.bluebookDir);

            // Process Math tests
            if (indexData.subjects?.Math) {
                const mathQuestions = await this.processSubjectTests(
                    indexData.subjects.Math,
                    'Math',
                    bluebookDir
                );
                allQuestions.push(...mathQuestions);
            }

            // Process English tests
            if (indexData.subjects?.English) {
                const englishQuestions = await this.processSubjectTests(
                    indexData.subjects.English,
                    'English',
                    bluebookDir
                );
                allQuestions.push(...englishQuestions);
            }

            logger.info(`Transformed ${allQuestions.length} total Bluebook questions`);

            if (allQuestions.length === 0) {
                logger.warn('No Bluebook questions to migrate');
                return 0;
            }

            // Insert data in batches
            const progress = new ProgressTracker(allQuestions.length, 'Bluebook Questions');

            const inserted = await db.batchInsert(
                this.tableName,
                this.columns,
                allQuestions,
                config.migration.batchSize
            );

            progress.complete();

            // Verify insertion
            const totalCount = await db.getTableCount(this.tableName);
            logger.info(`✅ Bluebook migration complete. Total questions in database: ${totalCount}`);

            return inserted;

        } catch (error) {
            logger.error('❌ Bluebook Tests migration failed:', error);
            throw error;
        }
    }

    async processSubjectTests(tests, subject, bluebookDir) {
        const questions = [];
        const subjectDir = join(bluebookDir, subject.toLowerCase());

        logger.info(`Processing ${tests.length} ${subject} tests`);

        for (const test of tests) {
            try {
                // Process module 1
                if (test.module1) {
                    const module1Questions = await this.processTestFile(
                        join(subjectDir, test.module1),
                        test,
                        subject,
                        'module1'
                    );
                    questions.push(...module1Questions);
                }

                // Process module 2
                if (test.module2) {
                    const module2Questions = await this.processTestFile(
                        join(subjectDir, test.module2),
                        test,
                        subject,
                        'module2'
                    );
                    questions.push(...module2Questions);
                }
            } catch (error) {
                logger.error(`Failed to process test ${test.testName}:`, error);
                // Continue with other tests
            }
        }

        return questions;
    }

    async processTestFile(filePath, testMeta, subject, module) {
        const questions = [];

        try {
            logger.debug(`Processing file: ${filePath}`);

            const fileContent = readFileSync(filePath, 'utf8');
            const testData = JSON.parse(fileContent);

            if (!testData.questions || !Array.isArray(testData.questions)) {
                logger.warn(`No questions found in ${filePath}`);
                return questions;
            }

            const metadata = testData.metadata || {};

            for (let i = 0; i < testData.questions.length; i++) {
                const question = testData.questions[i];

                try {
                    const transformedQuestion = this.transformQuestion(
                        question,
                        testMeta,
                        metadata,
                        subject,
                        module,
                        i + 1 // question_order (1-based)
                    );

                    if (transformedQuestion) {
                        questions.push(transformedQuestion);
                    }
                } catch (error) {
                    logger.error(`Failed to transform question ${i + 1} in ${filePath}:`, error);
                }
            }

            logger.debug(`Processed ${questions.length} questions from ${filePath}`);

        } catch (error) {
            logger.error(`Failed to read/parse file ${filePath}:`, error);
        }

        return questions;
    }

    transformQuestion(question, testMeta, metadata, subject, module, questionOrder) {
        if (!question.type) {
            logger.warn(`Skipping question with missing type`);
            return null;
        }

        // Transform options for choice questions
        let options = null;
        if (question.type === 'choice' && question.options) {
            options = question.options.map(option => ({
                name: option.name || '',
                content: option.content || ''
            }));
        }

        // Handle SPR answers (if any)
        let sprAnswers = null;
        if (question.type === 'spr' && question.spr_answers) {
            sprAnswers = Array.isArray(question.spr_answers) ? question.spr_answers : [];
        }

        // Generate a unique test_id from metadata
        const testId = metadata.testId || this.generateTestId(testMeta, subject, module);

        // Parse test date
        const testDate = testMeta.date || null;

        // Parse fetched_at
        const fetchedAt = metadata.fetchedAt ? new Date(metadata.fetchedAt) : new Date();

        return [
            testId,
            subject,
            testMeta.testName || '',
            testDate,
            module,
            testMeta.vip || 0,
            fetchedAt,
            question.type,
            question.article || '',
            question.question || '',
            options ? JSON.stringify(options) : null,
            question.correct || '',
            sprAnswers ? JSON.stringify(sprAnswers) : null,
            question.solution || '',
            questionOrder
        ];
    }

    generateTestId(testMeta, subject, module) {
        // Generate a consistent test ID from test metadata
        const testName = testMeta.testName || 'unknown';
        const date = testMeta.date || 'unknown';

        // Create a simple hash-like ID
        const baseString = `${testName}_${subject}_${module}_${date}`;
        return baseString.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    }

    async getStats() {
        try {
            const result = await db.query(`
        SELECT 
          subject,
          module,
          question_type,
          test_date,
          COUNT(*) as count
        FROM ${this.tableName}
        GROUP BY subject, module, question_type, test_date
        ORDER BY subject, module, question_type, test_date
      `);

            return result.rows;
        } catch (error) {
            logger.error('Failed to get stats:', error);
            return [];
        }
    }

    async getTestSummary() {
        try {
            const result = await db.query(`
        SELECT 
          test_name,
          subject,
          test_date,
          COUNT(*) as question_count,
          COUNT(DISTINCT module) as module_count
        FROM ${this.tableName}
        GROUP BY test_name, subject, test_date
        ORDER BY test_date DESC, subject, test_name
      `);

            return result.rows;
        } catch (error) {
            logger.error('Failed to get test summary:', error);
            return [];
        }
    }
}
