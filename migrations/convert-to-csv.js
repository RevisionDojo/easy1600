#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CSV conversion utilities
function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function arrayToCSV(headers, rows) {
    const csvHeaders = headers.join(',');
    const csvRows = rows.map(row =>
        row.map(cell => escapeCSV(cell)).join(',')
    ).join('\n');

    return `${csvHeaders}\n${csvRows}`;
}

// 1. Convert ALLEXAMSONEPREP.json to official_practice_questions.csv
function convertOfficialPracticeQuestions() {
    console.log('🔄 Converting questions_patched (2).json...');

    const filePath = join(__dirname, '../questions_patched (2).json');
    const data = JSON.parse(readFileSync(filePath, 'utf8'));

    const headers = [
        'question_id', 'exam_id', 'exam_name', 'answer_type',
        'stem_text', 'stem_html', 'explanation_text', 'explanation_html',
        'choices', 'spr_answers', 'meta', 'subject', 'module', 'difficulty',
        'scraped_at', 'first_question_id', 'questions_count'
    ];

    const rows = [];
    const scrapedAt = data.scraped_at ? new Date(data.scraped_at).toISOString() : new Date().toISOString();

    for (const exam of data.exams || []) {
        if (!exam.questions) continue;

        // Parse subject and module from exam name
        const examName = exam.name || '';
        const subject = examName.toLowerCase().includes('english') ? 'english' :
            examName.toLowerCase().includes('math') ? 'math' : null;
        const module = examName.toLowerCase().includes('module 1') ? 'module1' :
            examName.toLowerCase().includes('module 2') ? 'module2' : null;

        for (const question of exam.questions) {
            if (!question.question_id) continue;

            const choices = question.answer_type === 'mcq' && question.choices ?
                JSON.stringify(question.choices) : null;
            const sprAnswers = question.answer_type === 'spr' && question.spr_answers ?
                JSON.stringify(question.spr_answers) : null;

            rows.push([
                question.question_id,
                exam.exam_id,
                examName,
                question.answer_type,
                question.stem_text || '',
                question.stem_html || '',
                question.explanation_text || '',
                question.explanation_html || '',
                choices,
                sprAnswers,
                question.meta ? JSON.stringify(question.meta) : null,
                subject,
                module,
                'medium', // Default difficulty
                scrapedAt,
                exam.first_question_id || null,
                exam.questions_count || null
            ]);
        }
    }

    const csv = arrayToCSV(headers, rows);
    writeFileSync('official_practice_questions.csv', csv);
    console.log(`✅ Created official_practice_questions.csv with ${rows.length} questions`);
}

// 2. Convert oneprep_sat_suite_questionbank.json to op_question_bank.csv (College Board)
function convertCollegeBoardQuestions() {
    console.log('🔄 Converting oneprep_sat_suite_questionbank.json...');

    const filePath = join(__dirname, '../oneprep_sat_suite_questionbank.json');
    const data = JSON.parse(readFileSync(filePath, 'utf8'));

    const headers = [
        'question_id', 'question_url', 'uuid', 'source', 'difficulty',
        'source_order', 'primary_class', 'skill', 'module', 'answer_type',
        'stem_text', 'stem_html', 'answer_choices', 'correct_choice_letter',
        'spr_answers', 'explanation_text', 'explanation_html',
        'stimulus_text', 'stimulus_html', 'meta', 'seed_args', 'from_seeds'
    ];

    const rows = [];

    if (!data.questions || !Array.isArray(data.questions)) {
        console.log('⚠️ College Board data structure not recognized');
        return;
    }

    for (const question of data.questions) {
        const questionId = question.question_id || question.meta_from_seed?.id;
        if (!questionId) continue;

        // Extract page_data where the actual question content is
        const pageData = question.page_data || {};

        // Parse classification from seed args
        let primaryClass = null, skill = null, module = null;
        if (question.seed_args) {
            for (const arg of question.seed_args) {
                if (typeof arg === 'string') {
                    if (arg.includes('primary_class=')) primaryClass = arg.split('primary_class=')[1]?.split('&')[0];
                    if (arg.includes('skill=')) skill = arg.split('skill=')[1]?.split('&')[0];
                    if (arg.includes('module=')) module = arg.split('module=')[1]?.split('&')[0];
                }
            }
        }

        const answerChoices = pageData.answer_type === 'mcq' && pageData.answer_choices ?
            JSON.stringify(pageData.answer_choices) : null;
        const correctChoice = pageData.answer_choices?.find(c => c.is_correct)?.letter || null;
        const sprAnswers = pageData.answer_type === 'spr' && pageData.spr_answers ?
            JSON.stringify(pageData.spr_answers) : null;

        rows.push([
            questionId,
            question.question_url || null,
            question.meta_from_seed?.uuid || null,
            'collegeboard',
            question.meta_from_seed?.difficulty || null,
            question.meta_from_seed?.source_order || null,
            primaryClass,
            skill,
            module,
            pageData.answer_type || null,
            pageData.stem_text || '',
            pageData.stem_html || '',
            answerChoices,
            correctChoice,
            sprAnswers,
            pageData.explanation_text || '',
            pageData.explanation_html || '',
            null, // stimulus_text (College Board doesn't use)
            null, // stimulus_html (College Board doesn't use)
            null, // meta (College Board doesn't use this format)
            question.seed_args ? JSON.stringify(question.seed_args) : null,
            question.from_seeds ? JSON.stringify(question.from_seeds) : null
        ]);
    }

    const csv = arrayToCSV(headers, rows);
    writeFileSync('op_question_bank_collegeboard.csv', csv);
    console.log(`✅ Created op_question_bank_collegeboard.csv with ${rows.length} questions`);
}

// 3. Convert princetonreview.json to op_question_bank.csv (Princeton Review)
function convertPrincetonReviewQuestions() {
    console.log('🔄 Converting princetonreview.json...');

    const filePath = join(__dirname, '../princetonreview.json');
    const data = JSON.parse(readFileSync(filePath, 'utf8'));

    const headers = [
        'question_id', 'question_url', 'uuid', 'source', 'difficulty',
        'source_order', 'primary_class', 'skill', 'module', 'answer_type',
        'stem_text', 'stem_html', 'answer_choices', 'correct_choice_letter',
        'spr_answers', 'explanation_text', 'explanation_html',
        'stimulus_text', 'stimulus_html', 'meta', 'seed_args', 'from_seeds'
    ];

    const rows = [];

    for (const question of data) {
        if (!question.id || !question.page_data?.answer_type) continue;

        const pageData = question.page_data;
        const specs = question.specs || {};
        const meta = question.meta || {};

        const answerChoices = pageData.answer_type === 'mcq' && pageData.answer_choices ?
            JSON.stringify(pageData.answer_choices) : null;
        const correctChoice = pageData.answer_choices?.find(c => c.is_correct)?.letter || null;
        const sprAnswers = pageData.answer_type === 'spr' && pageData.spr_answers ?
            JSON.stringify(pageData.spr_answers) : null;

        // Map difficulty
        const difficultyMap = { 'Easy': 'E', 'Medium': 'M', 'Hard': 'H' };
        const difficulty = difficultyMap[meta.difficulty] || meta.difficulty;

        // Map module
        const moduleMap = { 'English': 'en', 'Math': 'math', 'Reading': 'en', 'Writing': 'en' };
        const module = moduleMap[meta.section] || meta.section?.toLowerCase();

        rows.push([
            question.id,
            question.url || null,
            null, // uuid (Princeton doesn't provide)
            'princeton',
            difficulty,
            null, // source_order
            meta.domain || null, // primary_class
            meta.skill || null,
            module,
            pageData.answer_type,
            specs.stem_text || '',
            specs.stem_html || '',
            answerChoices,
            correctChoice,
            sprAnswers,
            null, // explanation_text
            null, // explanation_html
            specs.stimulus_text || null,
            specs.stimulus_html || null,
            JSON.stringify(meta),
            null, // seed_args
            null  // from_seeds
        ]);
    }

    const csv = arrayToCSV(headers, rows);
    writeFileSync('op_question_bank_princeton.csv', csv);
    console.log(`✅ Created op_question_bank_princeton.csv with ${rows.length} questions`);
}

// 4. Convert bluebook tests to bluebook_test_questions.csv
function convertBluebookQuestions() {
    console.log('🔄 Converting Bluebook tests...');

    const indexPath = join(__dirname, '../bluebookplus_tests_output/index.json');
    const indexData = JSON.parse(readFileSync(indexPath, 'utf8'));

    const headers = [
        'test_id', 'subject', 'test_name', 'test_date', 'module', 'vip',
        'fetched_at', 'question_type', 'article', 'question', 'options',
        'correct_answer', 'spr_answers', 'solution', 'question_order'
    ];

    const rows = [];
    const bluebookDir = join(__dirname, '../bluebookplus_tests_output');

    // Process Math tests
    if (indexData.subjects?.Math) {
        for (const test of indexData.subjects.Math) {
            processTestFiles(test, 'Math', 'math', bluebookDir, rows);
        }
    }

    // Process English tests
    if (indexData.subjects?.English) {
        for (const test of indexData.subjects.English) {
            processTestFiles(test, 'English', 'english', bluebookDir, rows);
        }
    }

    const csv = arrayToCSV(headers, rows);
    writeFileSync('bluebook_test_questions.csv', csv);
    console.log(`✅ Created bluebook_test_questions.csv with ${rows.length} questions`);
}

function processTestFiles(test, subject, subjectDir, bluebookDir, rows) {
    const processFile = (fileName, module) => {
        if (!fileName) return;

        try {
            const filePath = join(bluebookDir, subjectDir, fileName);
            const testData = JSON.parse(readFileSync(filePath, 'utf8'));
            const metadata = testData.metadata || {};

            if (!testData.questions) return;

            const testId = metadata.testId || `${test.testName}_${subject}_${module}_${test.date}`.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
            const fetchedAt = metadata.fetchedAt ? new Date(metadata.fetchedAt).toISOString() : new Date().toISOString();

            testData.questions.forEach((question, index) => {
                const options = question.type === 'choice' && question.options ?
                    JSON.stringify(question.options) : null;
                const sprAnswers = question.type === 'spr' && question.spr_answers ?
                    JSON.stringify(question.spr_answers) : null;

                rows.push([
                    testId,
                    subject,
                    test.testName || '',
                    test.date || null,
                    module,
                    test.vip || 0,
                    fetchedAt,
                    question.type,
                    question.article || '',
                    question.question || '',
                    options,
                    question.correct || '',
                    sprAnswers,
                    question.solution || '',
                    index + 1
                ]);
            });
        } catch (error) {
            console.error(`Error processing ${fileName}:`, error.message);
        }
    };

    processFile(test.module1, 'module1');
    processFile(test.module2, 'module2');
}

// Main execution
async function main() {
    console.log('🚀 Converting JSON files to CSV format...\n');

    try {
        convertOfficialPracticeQuestions();
        convertCollegeBoardQuestions();
        convertPrincetonReviewQuestions();
        convertBluebookQuestions();

        console.log('\n🎉 All CSV files created successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Go to your Supabase Dashboard → SQL Editor');
        console.log('2. Copy and paste the database_schema.sql content');
        console.log('3. Run the schema to create all tables');
        console.log('4. Go to Table Editor and import each CSV file:');
        console.log('   - official_practice_questions.csv → official_practice_questions table');
        console.log('   - op_question_bank_collegeboard.csv → op_question_bank table');
        console.log('   - op_question_bank_princeton.csv → op_question_bank table');
        console.log('   - bluebook_test_questions.csv → bluebook_test_questions table');

    } catch (error) {
        console.error('❌ Error during conversion:', error);
        process.exit(1);
    }
}

main();
