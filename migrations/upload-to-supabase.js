import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from main .env file
const envPath = join(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.jwt_serivce_role_secret;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Batch size for uploads (Supabase has limits)
const BATCH_SIZE = 1000;

/**
 * Upload data in batches to avoid Supabase limits
 */
async function uploadInBatches(tableName, data, batchSize = BATCH_SIZE) {
    console.log(`📤 Uploading ${data.length} records to ${tableName} in batches of ${batchSize}...`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(data.length / batchSize);

        console.log(`   📦 Batch ${batchNumber}/${totalBatches} (${batch.length} records)...`);

        try {
            const { data: result, error } = await supabase
                .from(tableName)
                .insert(batch);

            if (error) {
                console.error(`   ❌ Batch ${batchNumber} failed:`, error.message);
                errorCount += batch.length;
            } else {
                console.log(`   ✅ Batch ${batchNumber} uploaded successfully`);
                successCount += batch.length;
            }
        } catch (err) {
            console.error(`   ❌ Batch ${batchNumber} error:`, err.message);
            errorCount += batch.length;
        }

        // Small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📊 ${tableName} upload complete: ${successCount} success, ${errorCount} errors\n`);
    return { successCount, errorCount };
}

/**
 * Parse CSV file and return array of objects
 */
function parseCSV(filePath) {
    console.log(`📂 Reading ${filePath}...`);

    try {
        const csvContent = readFileSync(filePath, 'utf8');
        const records = parse(csvContent, {
            columns: true, // Use first row as headers
            skip_empty_lines: true,
            skip_records_with_empty_values: false,
            cast: (value, context) => {
                // Handle null values
                if (value === '' || value === 'null') return null;

                // Parse JSON fields
                if (context.column === 'choices' ||
                    context.column === 'spr_answers' ||
                    context.column === 'meta' ||
                    context.column === 'seed_args' ||
                    context.column === 'from_seeds') {
                    try {
                        return value ? JSON.parse(value) : null;
                    } catch {
                        return value;
                    }
                }

                // Parse integers
                if (context.column === 'difficulty' ||
                    context.column === 'source_order' ||
                    context.column === 'questions_count') {
                    const num = parseInt(value);
                    return isNaN(num) ? null : num;
                }

                return value;
            }
        });

        console.log(`✅ Parsed ${records.length} records from CSV`);
        return records;
    } catch (error) {
        console.error(`❌ Error reading ${filePath}:`, error.message);
        return [];
    }
}

/**
 * Upload Official Practice Questions
 */
async function uploadOfficialPracticeQuestions() {
    console.log('🎯 Uploading Official Practice Questions...');

    const filePath = join(__dirname, 'official_practice_questions_fixed.csv');
    const data = parseCSV(filePath);

    if (data.length === 0) {
        console.log('⚠️ No data found in official_practice_questions.csv');
        return { successCount: 0, errorCount: 0 };
    }

    return await uploadInBatches('official_practice_questions', data);
}

/**
 * Upload OP Question Bank (College Board)
 */
async function uploadOpQuestionBankCollegeBoard() {
    console.log('🎯 Uploading OP Question Bank (College Board)...');

    const filePath = join(__dirname, 'op_question_bank_collegeboard_fixed.csv');
    const data = parseCSV(filePath);

    if (data.length === 0) {
        console.log('⚠️ No data found in op_question_bank_collegeboard.csv');
        return { successCount: 0, errorCount: 0 };
    }

    return await uploadInBatches('op_question_bank', data);
}

/**
 * Upload OP Question Bank (Princeton Review)
 */
async function uploadOpQuestionBankPrinceton() {
    console.log('🎯 Uploading OP Question Bank (Princeton Review)...');

    const filePath = join(__dirname, 'op_question_bank_princeton.csv');
    const data = parseCSV(filePath);

    if (data.length === 0) {
        console.log('⚠️ No data found in op_question_bank_princeton.csv');
        return { successCount: 0, errorCount: 0 };
    }

    return await uploadInBatches('op_question_bank', data);
}

/**
 * Upload Bluebook Test Questions
 */
async function uploadBluebookTestQuestions() {
    console.log('🎯 Uploading Bluebook Test Questions...');

    const filePath = join(__dirname, 'bluebook_test_questions_fixed.csv');
    const data = parseCSV(filePath);

    if (data.length === 0) {
        console.log('⚠️ No data found in bluebook_test_questions.csv');
        return { successCount: 0, errorCount: 0 };
    }

    return await uploadInBatches('bluebook_test_questions', data);
}

/**
 * Test database connection
 */
async function testConnection() {
    console.log('🔌 Testing Supabase connection...');

    try {
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist"
            console.error('❌ Connection failed:', error.message);
            return false;
        }

        console.log('✅ Supabase connection successful');
        return true;
    } catch (err) {
        console.error('❌ Connection error:', err.message);
        return false;
    }
}

/**
 * Main upload function
 */
async function main() {
    console.log('🚀 Starting Supabase Upload Process...\n');

    // Test connection first
    const connectionOk = await testConnection();
    if (!connectionOk) {
        console.log('❌ Please check your database connection and schema setup');
        process.exit(1);
    }

    console.log('📋 Upload Plan:');
    console.log('   1. Official Practice Questions (ALLEXAMSONEPREP.json)');
    console.log('   2. OP Question Bank - College Board');
    console.log('   3. OP Question Bank - Princeton Review');
    console.log('   4. Bluebook Test Questions');
    console.log('');

    const results = {
        official_practice: { successCount: 0, errorCount: 0 },
        op_collegeboard: { successCount: 0, errorCount: 0 },
        op_princeton: { successCount: 0, errorCount: 0 },
        bluebook: { successCount: 0, errorCount: 0 }
    };

    try {
        // Upload each dataset
        results.official_practice = await uploadOfficialPracticeQuestions();
        results.op_collegeboard = await uploadOpQuestionBankCollegeBoard();
        results.op_princeton = await uploadOpQuestionBankPrinceton();
        results.bluebook = await uploadBluebookTestQuestions();

        // Summary
        console.log('🎉 Upload Process Complete!\n');
        console.log('📊 Final Results:');
        console.log(`   Official Practice Questions: ${results.official_practice.successCount} uploaded, ${results.official_practice.errorCount} errors`);
        console.log(`   OP Question Bank (College Board): ${results.op_collegeboard.successCount} uploaded, ${results.op_collegeboard.errorCount} errors`);
        console.log(`   OP Question Bank (Princeton): ${results.op_princeton.successCount} uploaded, ${results.op_princeton.errorCount} errors`);
        console.log(`   Bluebook Test Questions: ${results.bluebook.successCount} uploaded, ${results.bluebook.errorCount} errors`);

        const totalSuccess = Object.values(results).reduce((sum, r) => sum + r.successCount, 0);
        const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errorCount, 0);

        console.log(`\n🎯 Total: ${totalSuccess} questions uploaded successfully, ${totalErrors} errors`);

        if (totalErrors > 0) {
            console.log('\n⚠️ Some uploads failed. Check the error messages above for details.');
            process.exit(1);
        } else {
            console.log('\n✅ All data uploaded successfully! Your SAT prep database is ready! 🚀');
        }

    } catch (error) {
        console.error('❌ Upload process failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the upload
main();
