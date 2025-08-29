#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
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

// Convert questions_patched (2).json to official_practice_questions.csv
function convertOfficialPracticeQuestions() {
    console.log('🔄 Converting ALLEXAMSONEPREP.json...');

    const filePath = join(__dirname, '../ALLEXAMSONEPREP.json');
    console.log('📂 Reading file:', filePath);

    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    console.log('✅ File loaded successfully');
    console.log('📊 Number of exams:', data.exams?.length || 0);

    // Count total questions first
    let totalQuestions = 0;
    for (const exam of data.exams || []) {
        totalQuestions += exam.questions?.length || 0;
    }
    console.log('📝 Total questions found:', totalQuestions);

    const headers = [
        'question_id', 'exam_id', 'exam_name', 'answer_type',
        'stem_text', 'stem_html', 'explanation_text', 'explanation_html',
        'choices', 'spr_answers', 'meta', 'subject', 'module', 'difficulty',
        'scraped_at', 'first_question_id', 'questions_count'
    ];

    const rows = [];
    const scrapedAt = data.scraped_at ? new Date(data.scraped_at).toISOString() : new Date().toISOString();

    let processedCount = 0;

    for (const exam of data.exams || []) {
        if (!exam.questions || !Array.isArray(exam.questions)) continue;

        // Extract subject and module from exam name
        const examName = exam.name || '';
        const subject = examName.toLowerCase().includes('english') ? 'english' :
            examName.toLowerCase().includes('math') ? 'math' : null;
        const module = examName.toLowerCase().includes('module 1') ? 'module1' :
            examName.toLowerCase().includes('module 2') ? 'module2' : null;

        for (const question of exam.questions) {
            if (!question.question_id) continue;

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

            rows.push([
                question.question_id,
                parseInt(exam.exam_id),
                examName,
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
                'medium', // Default difficulty
                scrapedAt,
                parseInt(exam.first_question_id) || null,
                parseInt(exam.questions_count) || null
            ]);

            processedCount++;

            // Progress indicator
            if (processedCount % 1000 === 0) {
                console.log(`⏳ Processed ${processedCount}/${totalQuestions} questions...`);
            }
        }
    }

    console.log('🔄 Converting to CSV format...');
    const csv = arrayToCSV(headers, rows);

    console.log('💾 Writing CSV file...');
    writeFileSync('official_practice_questions.csv', csv);

    console.log(`✅ Created official_practice_questions.csv with ${rows.length} questions`);

    // Show some stats
    const stats = {};
    rows.forEach(row => {
        const subject = row[11]; // subject column
        const answerType = row[3]; // answer_type column
        const key = `${subject || 'unknown'}_${answerType}`;
        stats[key] = (stats[key] || 0) + 1;
    });

    console.log('\n📊 Question Statistics:');
    Object.entries(stats).forEach(([key, count]) => {
        console.log(`   ${key}: ${count.toLocaleString()}`);
    });
}

// Main execution
async function main() {
    console.log('🚀 Converting ALLEXAMSONEPREP.json to CSV format...\n');

    try {
        convertOfficialPracticeQuestions();

        console.log('\n🎉 Conversion completed successfully!');
        console.log('\n📋 Next step:');
        console.log('   Upload official_practice_questions.csv to your Supabase official_practice_questions table');

    } catch (error) {
        console.error('❌ Error during conversion:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

main();
