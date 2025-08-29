import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Fix Official Practice Questions - Remove duplicates
 */
function fixOfficialPracticeQuestions() {
    console.log('🔧 Fixing Official Practice Questions...');
    
    const filePath = join(__dirname, 'official_practice_questions.csv');
    const csvContent = readFileSync(filePath, 'utf8');
    const records = parse(csvContent, { columns: true });
    
    console.log(`📊 Original records: ${records.length}`);
    
    // Track seen question_ids and remove duplicates
    const seen = new Set();
    const uniqueRecords = [];
    const duplicates = [];
    
    for (const record of records) {
        if (seen.has(record.question_id)) {
            duplicates.push(record.question_id);
        } else {
            seen.add(record.question_id);
            uniqueRecords.push(record);
        }
    }
    
    console.log(`📊 Unique records: ${uniqueRecords.length}`);
    console.log(`📊 Duplicates removed: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
        console.log(`🔍 Sample duplicates: ${duplicates.slice(0, 5).join(', ')}`);
    }
    
    // Write fixed file
    const fixedCsv = stringify(uniqueRecords, { header: true });
    const outputPath = join(__dirname, 'official_practice_questions_fixed.csv');
    writeFileSync(outputPath, fixedCsv);
    
    console.log(`✅ Fixed file saved: official_practice_questions_fixed.csv\n`);
    return uniqueRecords.length;
}

/**
 * Fix OP Question Bank College Board - Handle null answer_types
 */
function fixOpQuestionBankCollegeBoard() {
    console.log('🔧 Fixing OP Question Bank (College Board)...');
    
    const filePath = join(__dirname, 'op_question_bank_collegeboard.csv');
    const csvContent = readFileSync(filePath, 'utf8');
    const records = parse(csvContent, { columns: true });
    
    console.log(`📊 Original records: ${records.length}`);
    
    let nullAnswerTypes = 0;
    let fixedRecords = 0;
    
    const fixedData = records.map(record => {
        if (!record.answer_type || record.answer_type === 'null' || record.answer_type === '') {
            nullAnswerTypes++;
            
            // Try to infer answer_type from other fields
            if (record.spr_answers && record.spr_answers !== 'null' && record.spr_answers !== '') {
                record.answer_type = 'spr';
                fixedRecords++;
            } else if (record.choices && record.choices !== 'null' && record.choices !== '') {
                record.answer_type = 'mcq';
                fixedRecords++;
            } else {
                // Default to mcq for College Board questions
                record.answer_type = 'mcq';
                fixedRecords++;
            }
        }
        return record;
    });
    
    console.log(`📊 Null answer_types found: ${nullAnswerTypes}`);
    console.log(`📊 Records fixed: ${fixedRecords}`);
    
    // Write fixed file
    const fixedCsv = stringify(fixedData, { header: true });
    const outputPath = join(__dirname, 'op_question_bank_collegeboard_fixed.csv');
    writeFileSync(outputPath, fixedCsv);
    
    console.log(`✅ Fixed file saved: op_question_bank_collegeboard_fixed.csv\n`);
    return fixedData.length;
}

/**
 * Fix Bluebook Test Questions - Handle invalid question_types
 */
function fixBluebookTestQuestions() {
    console.log('🔧 Fixing Bluebook Test Questions...');
    
    const filePath = join(__dirname, 'bluebook_test_questions.csv');
    const csvContent = readFileSync(filePath, 'utf8');
    const records = parse(csvContent, { columns: true });
    
    console.log(`📊 Original records: ${records.length}`);
    
    // Analyze current answer_types
    const answerTypes = {};
    records.forEach(record => {
        const type = record.answer_type || 'null';
        answerTypes[type] = (answerTypes[type] || 0) + 1;
    });
    
    console.log('📊 Current answer_types:', answerTypes);
    
    let invalidTypes = 0;
    let fixedRecords = 0;
    
    const fixedData = records.map(record => {
        // Map bluebook question types to schema types
        if (record.answer_type === 'choice') {
            record.answer_type = 'mcq';
            fixedRecords++;
        } else if (record.answer_type === 'write') {
            record.answer_type = 'spr';
            fixedRecords++;
        } else if (!record.answer_type || !['mcq', 'spr'].includes(record.answer_type)) {
            invalidTypes++;
            
            // Try to infer correct answer_type
            if (record.spr_answers && record.spr_answers !== 'null' && record.spr_answers !== '') {
                record.answer_type = 'spr';
                fixedRecords++;
            } else if (record.choices && record.choices !== 'null' && record.choices !== '') {
                record.answer_type = 'mcq';
                fixedRecords++;
            } else {
                // Default to mcq
                record.answer_type = 'mcq';
                fixedRecords++;
            }
        }
        return record;
    });
    
    console.log(`📊 Invalid answer_types found: ${invalidTypes}`);
    console.log(`📊 Records fixed: ${fixedRecords}`);
    
    // Write fixed file
    const fixedCsv = stringify(fixedData, { header: true });
    const outputPath = join(__dirname, 'bluebook_test_questions_fixed.csv');
    writeFileSync(outputPath, fixedCsv);
    
    console.log(`✅ Fixed file saved: bluebook_test_questions_fixed.csv\n`);
    return fixedData.length;
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 Analyzing and Fixing Data Issues...\n');
    
    try {
        const results = {
            officialPractice: fixOfficialPracticeQuestions(),
            opCollegeBoard: fixOpQuestionBankCollegeBoard(),
            bluebook: fixBluebookTestQuestions()
        };
        
        console.log('🎉 Data Fixing Complete!\n');
        console.log('📊 Fixed Files Summary:');
        console.log(`   official_practice_questions_fixed.csv: ${results.officialPractice} records`);
        console.log(`   op_question_bank_collegeboard_fixed.csv: ${results.opCollegeBoard} records`);
        console.log(`   bluebook_test_questions_fixed.csv: ${results.bluebook} records`);
        console.log('\n✅ Ready for re-upload with fixed data!');
        
    } catch (error) {
        console.error('❌ Error fixing data:', error.message);
        process.exit(1);
    }
}

main();
