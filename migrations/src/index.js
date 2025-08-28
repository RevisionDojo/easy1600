#!/usr/bin/env node

import { db } from './utils/database.js';
import { logger } from './utils/logger.js';
import { config } from './utils/config.js';
import { OfficialPracticeMigrator } from './migrators/OfficialPracticeMigrator.js';
import { OpQuestionBankMigrator } from './migrators/OpQuestionBankMigrator.js';
import { BluebookMigrator } from './migrators/BluebookMigrator.js';

class MigrationRunner {
    constructor() {
        this.stats = {
            officialPractice: 0,
            collegeBoard: 0,
            princetonReview: 0,
            bluebook: 0,
            total: 0,
            startTime: null,
            endTime: null
        };
    }

    async run() {
        this.stats.startTime = Date.now();

        logger.info('🚀 Starting SAT Prep Database Migration');
        logger.info('=====================================');
        logger.info(`Batch size: ${config.migration.batchSize}`);
        logger.info(`Max retries: ${config.migration.maxRetries}`);
        logger.info('');

        try {
            // Test database connection
            await this.testConnection();

            // Enable service mode to bypass RLS
            await db.enableServiceMode();

            // Run migrations in sequence
            await this.migrateOfficialPractice();
            await this.migrateCollegeBoard();
            await this.migratePrincetonReview();
            await this.migrateBluebook();

            // Generate final report
            await this.generateReport();

        } catch (error) {
            logger.error('❌ Migration failed:', error);
            process.exit(1);
        } finally {
            // Always disable service mode and close connections
            try {
                await db.disableServiceMode();
                await db.close();
            } catch (error) {
                logger.error('Error during cleanup:', error);
            }
        }
    }

    async testConnection() {
        logger.info('🔌 Testing database connection...');

        try {
            await db.connect();
            logger.info('✅ Database connection successful');
        } catch (error) {
            logger.error('❌ Database connection failed:', error);
            throw error;
        }
    }

    async migrateOfficialPractice() {
        logger.info('');
        logger.info('📚 OFFICIAL PRACTICE QUESTIONS');
        logger.info('==============================');

        try {
            const migrator = new OfficialPracticeMigrator();
            const inserted = await migrator.migrate();
            this.stats.officialPractice = inserted;

            // Show stats
            const stats = await migrator.getStats();
            this.logStats('Official Practice', stats);

        } catch (error) {
            logger.error('❌ Official Practice migration failed:', error);
            throw error;
        }
    }

    async migrateCollegeBoard() {
        logger.info('');
        logger.info('🏛️  COLLEGE BOARD QUESTION BANK');
        logger.info('===============================');

        try {
            const migrator = new OpQuestionBankMigrator();
            const inserted = await migrator.migrateCollegeBoard();
            this.stats.collegeBoard = inserted;

        } catch (error) {
            logger.error('❌ College Board migration failed:', error);
            throw error;
        }
    }

    async migratePrincetonReview() {
        logger.info('');
        logger.info('🎓 PRINCETON REVIEW QUESTIONS');
        logger.info('=============================');

        try {
            const migrator = new OpQuestionBankMigrator();
            const inserted = await migrator.migratePrincetonReview();
            this.stats.princetonReview = inserted;

            // Show combined stats for op_question_bank
            const stats = await migrator.getStats();
            this.logStats('Question Bank (Combined)', stats);

        } catch (error) {
            logger.error('❌ Princeton Review migration failed:', error);
            throw error;
        }
    }

    async migrateBluebook() {
        logger.info('');
        logger.info('📖 BLUEBOOK TEST QUESTIONS');
        logger.info('==========================');

        try {
            const migrator = new BluebookMigrator();
            const inserted = await migrator.migrate();
            this.stats.bluebook = inserted;

            // Show stats
            const stats = await migrator.getStats();
            this.logStats('Bluebook Tests', stats);

            // Show test summary
            const testSummary = await migrator.getTestSummary();
            this.logTestSummary(testSummary);

        } catch (error) {
            logger.error('❌ Bluebook migration failed:', error);
            throw error;
        }
    }

    async generateReport() {
        this.stats.endTime = Date.now();
        this.stats.total = this.stats.officialPractice + this.stats.collegeBoard +
            this.stats.princetonReview + this.stats.bluebook;

        const duration = (this.stats.endTime - this.stats.startTime) / 1000;
        const questionsPerSecond = Math.round(this.stats.total / duration);

        logger.info('');
        logger.info('🎉 MIGRATION COMPLETE');
        logger.info('=====================');
        logger.info(`✅ Official Practice Questions: ${this.stats.officialPractice.toLocaleString()}`);
        logger.info(`✅ College Board Questions: ${this.stats.collegeBoard.toLocaleString()}`);
        logger.info(`✅ Princeton Review Questions: ${this.stats.princetonReview.toLocaleString()}`);
        logger.info(`✅ Bluebook Questions: ${this.stats.bluebook.toLocaleString()}`);
        logger.info('─'.repeat(50));
        logger.info(`📊 Total Questions Migrated: ${this.stats.total.toLocaleString()}`);
        logger.info(`⏱️  Total Time: ${duration.toFixed(1)}s`);
        logger.info(`🚀 Speed: ${questionsPerSecond.toLocaleString()} questions/second`);
        logger.info('');

        // Get final database counts
        await this.logFinalCounts();
    }

    async logFinalCounts() {
        try {
            const officialCount = await db.getTableCount('official_practice_questions');
            const opBankCount = await db.getTableCount('op_question_bank');
            const bluebookCount = await db.getTableCount('bluebook_test_questions');
            const totalCount = officialCount + opBankCount + bluebookCount;

            logger.info('📈 FINAL DATABASE COUNTS');
            logger.info('========================');
            logger.info(`Official Practice Questions: ${officialCount.toLocaleString()}`);
            logger.info(`Question Bank (CB + Princeton): ${opBankCount.toLocaleString()}`);
            logger.info(`Bluebook Test Questions: ${bluebookCount.toLocaleString()}`);
            logger.info('─'.repeat(40));
            logger.info(`Total Questions in Database: ${totalCount.toLocaleString()}`);
            logger.info('');
        } catch (error) {
            logger.error('Failed to get final counts:', error);
        }
    }

    logStats(title, stats) {
        if (!stats || stats.length === 0) {
            logger.info(`No stats available for ${title}`);
            return;
        }

        logger.info(`📊 ${title} Statistics:`);

        // Group by relevant fields
        const grouped = {};
        for (const stat of stats) {
            const key = `${stat.subject || 'N/A'} - ${stat.module || 'N/A'} - ${stat.answer_type || 'N/A'}`;
            if (!grouped[key]) {
                grouped[key] = 0;
            }
            grouped[key] += parseInt(stat.count);
        }

        for (const [key, count] of Object.entries(grouped)) {
            logger.info(`  ${key}: ${count.toLocaleString()}`);
        }
    }

    logTestSummary(testSummary) {
        if (!testSummary || testSummary.length === 0) {
            return;
        }

        logger.info('📋 Test Summary:');

        const subjectGroups = {};
        for (const test of testSummary) {
            if (!subjectGroups[test.subject]) {
                subjectGroups[test.subject] = [];
            }
            subjectGroups[test.subject].push(test);
        }

        for (const [subject, tests] of Object.entries(subjectGroups)) {
            const totalQuestions = tests.reduce((sum, test) => sum + parseInt(test.question_count), 0);
            logger.info(`  ${subject}: ${tests.length} tests, ${totalQuestions.toLocaleString()} questions`);
        }
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
    try {
        switch (command) {
            case 'official':
                const officialMigrator = new OfficialPracticeMigrator();
                await db.connect();
                await db.enableServiceMode();
                await officialMigrator.migrate();
                await db.disableServiceMode();
                break;

            case 'collegeboard':
                const cbMigrator = new OpQuestionBankMigrator();
                await db.connect();
                await db.enableServiceMode();
                await cbMigrator.migrateCollegeBoard();
                await db.disableServiceMode();
                break;

            case 'princeton':
                const prMigrator = new OpQuestionBankMigrator();
                await db.connect();
                await db.enableServiceMode();
                await prMigrator.migratePrincetonReview();
                await db.disableServiceMode();
                break;

            case 'bluebook':
                const bbMigrator = new BluebookMigrator();
                await db.connect();
                await db.enableServiceMode();
                await bbMigrator.migrate();
                await db.disableServiceMode();
                break;

            default:
                // Run full migration
                const runner = new MigrationRunner();
                await runner.run();
                break;
        }
    } catch (error) {
        logger.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await db.close();
    }
}

// Handle process signals
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await db.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await db.close();
    process.exit(0);
});

// Run the migration
main().catch(error => {
    logger.error('Unhandled error:', error);
    process.exit(1);
});
