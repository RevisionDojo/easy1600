#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to patch ALLEXAMSONEPREP.json by fetching missing stem_text from oneprep.xyz
 * 
 * This script:
 * 1. Identifies questions with empty or incomplete stem_text
 * 2. Fetches the complete question data from oneprep.xyz
 * 3. Extracts stem_text and stem_html from the HTML response
 * 4. Updates the JSON file with the patched data
 */

const ONEPREP_BASE_URL = 'https://oneprep.xyz/question/';
const JSON_FILE_PATH = path.join(__dirname, 'ALLEXAMSONEPREP.json');
const BACKUP_FILE_PATH = path.join(__dirname, 'ALLEXAMSONEPREP.backup.json');

// Headers to use for requests (from the provided example)
const REQUEST_HEADERS = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "priority": "u=0, i",
    "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "cookie": "_ga=GA1.1.144525577.1752664761; cfz_google-analytics_v4=%7B%22QRJG_engagementDuration%22%3A%7B%22v%22%3A%220%22%2C%22e%22%3A1784275526511%7D%2C%22QRJG_engagementStart%22%3A%7B%22v%22%3A%221752739526511%22%2C%22e%22%3A1784275526511%7D%2C%22QRJG_counter%22%3A%7B%22v%22%3A%2271%22%2C%22e%22%3A1784275526511%7D%2C%22QRJG_session_counter%22%3A%7B%22v%22%3A%223%22%2C%22e%22%3A1784275526511%7D%2C%22QRJG_ga4%22%3A%7B%22v%22%3A%2298081521-c42b-453d-9a35-5e7037becc55%22%2C%22e%22%3A1784275526511%7D%2C%22QRJG__z_ga_audiences%22%3A%7B%22v%22%3A%2298081521-c42b-453d-9a35-5e7037becc55%22%2C%22e%22%3A1784200761350%7D%2C%22QRJG_let%22%3A%7B%22v%22%3A%221752739526511%22%2C%22e%22%3A1784275526511%7D%2C%22QRJG_ga4sid%22%3A%7B%22v%22%3A%221727791235%22%2C%22e%22%3A1752741326511%7D%7D; messages=.eJxtzDEKwzAMQNGrCM0ihEKHbIUeoWMIQXVkx8WWwHIKvX0DXQt_-sObZ1zXl5uuVdw5CdJIl5Hwbhpzq9yzKUjlXMBFO3SDabplVXtztxZ2LkU0yWAtDUiIC_0lr4SPI4TzxKOUD3hOKhtkBXZ48u5bPPsJyxdTWTNS:1urNDn:oBSosb5ySs8NVMbI_QAtkIoJ9fG4n1CDObe8jX8BnY8; csrftoken=PfGUbq59dbnnzVEwNHedNj3MsAKpTxGw; sessionid=y7z4vsg6ica04ylln5r5ytl8kdkxip8v; _ga_9XC7HL2GZF=GS2.1.s1756393055$o14$g1$t1756393111$j4$l0$h1639605712; _ga_WD0CE4KQWK=GS2.1.s1756393055$o14$g1$t1756393111$j4$l0$h760021954"
};

// Delay between requests to avoid overwhelming the server
const REQUEST_DELAY_MS = 100;

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a question needs patching
 * A question needs patching if:
 * 1. stem_text is empty, or
 * 2. stem_text ends with "This content is collected from OnePrep.xyz" (incomplete)
 */
function needsPatching(question) {
    const stemText = question.stem_text || '';
    return stemText === '' ||
        stemText.trim().endsWith('This content is collected from OnePrep.xyz') ||
        stemText.trim().length < 20; // Very short stem_text might be incomplete
}

/**
 * Fetch question data from oneprep.xyz
 */
async function fetchQuestionData(questionId) {
    const url = `${ONEPREP_BASE_URL}${questionId}/`;

    try {
        console.log(`Fetching question ${questionId} from ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: REQUEST_HEADERS
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        return html;
    } catch (error) {
        console.error(`Error fetching question ${questionId}:`, error.message);
        return null;
    }
}

/**
 * Extract stem_text and stem_html from HTML response
 */
function extractStemData(html) {
    try {
        let stem_html = null;
        let containerType = null;

        // Try pattern 1: question-stimulus div
        const stimulusMatch = html.match(/<div id="question-stimulus">\s*<div class="[^"]*">([\s\S]*?)<\/div>\s*<\/div>/);

        if (stimulusMatch) {
            stem_html = stimulusMatch[1].trim();
            containerType = 'question-stimulus';
        } else {
            // Try pattern 2: question-stem div
            const stemMatch = html.match(/<div class="[^"]*" id="question-stem">([\s\S]*?)<\/div>/);

            if (stemMatch) {
                stem_html = stemMatch[1].trim();
                containerType = 'question-stem';
            }
        }

        if (!stem_html) {
            console.error('Could not find question content in either question-stimulus or question-stem div');
            return null;
        }

        console.log(`Found content in ${containerType} div`);

        // Convert HTML to plain text for stem_text
        let stem_text = stem_html
            .replace(/<span[^>]*aria-hidden="true"[^>]*>______<\/span>/g, '______blank')
            .replace(/<span[^>]*class="sr-only"[^>]*>blank<\/span>/g, '')
            .replace(/<span[^>]*style="color: transparent"[^>]*>[\s\S]*?<\/span>/g, 'This content is collected from OnePrep.xyz')
            .replace(/<math[^>]*>[\s\S]*?<\/math>/g, (match) => {
                // Extract alttext from math tags if available
                const alttextMatch = match.match(/alttext="([^"]*)"/);
                return alttextMatch ? alttextMatch[1] : match;
            })
            .replace(/<[^>]+>/g, '') // Remove all HTML tags
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/(This content is collected from OnePrep\.xyz)+/g, 'This content is collected from OnePrep.xyz') // Remove duplicates
            .trim();

        return {
            stem_text,
            stem_html: `<div class="">${stem_html}</div>`
        };
    } catch (error) {
        console.error('Error extracting stem data:', error.message);
        return null;
    }
}

/**
 * Create a backup of the original file
 */
function createBackup() {
    try {
        if (fs.existsSync(JSON_FILE_PATH)) {
            fs.copyFileSync(JSON_FILE_PATH, BACKUP_FILE_PATH);
            console.log(`Backup created: ${BACKUP_FILE_PATH}`);
        }
    } catch (error) {
        console.error('Error creating backup:', error.message);
        throw error;
    }
}

/**
 * Load and parse the JSON file
 */
function loadJsonFile() {
    try {
        const jsonContent = fs.readFileSync(JSON_FILE_PATH, 'utf8');
        return JSON.parse(jsonContent);
    } catch (error) {
        console.error('Error loading JSON file:', error.message);
        throw error;
    }
}

/**
 * Save the updated JSON file
 */
function saveJsonFile(data) {
    try {
        const jsonContent = JSON.stringify(data, null, 2);
        fs.writeFileSync(JSON_FILE_PATH, jsonContent, 'utf8');
        console.log('JSON file updated successfully');
    } catch (error) {
        console.error('Error saving JSON file:', error.message);
        throw error;
    }
}

/**
 * Main function to patch the JSON file
 */
async function patchJsonFile(testMode = false, maxQuestions = 5) {
    console.log('Starting ALLEXAMSONEPREP.json patching process...');

    // Create backup
    createBackup();

    // Load JSON data
    const data = loadJsonFile();

    let totalQuestions = 0;
    let questionsNeedingPatch = 0;
    let questionsPatched = 0;
    let errors = 0;

    if (testMode) {
        console.log(`\n🧪 TEST MODE: Will patch maximum ${maxQuestions} questions`);
    }

    // Process each exam
    for (const exam of data.exams) {
        console.log(`\nProcessing exam: ${exam.name}`);

        // Process each question in the exam
        for (const question of exam.questions) {
            totalQuestions++;

            if (needsPatching(question)) {
                questionsNeedingPatch++;

                // In test mode, stop after maxQuestions
                if (testMode && questionsPatched >= maxQuestions) {
                    console.log(`\n🧪 TEST MODE: Reached maximum of ${maxQuestions} questions, stopping...`);
                    break;
                }

                console.log(`Question ${question.question_id} needs patching`);

                // Fetch question data from oneprep.xyz
                const html = await fetchQuestionData(question.question_id);

                if (html) {
                    // Extract stem data
                    const stemData = extractStemData(html);

                    if (stemData) {
                        // Update the question
                        question.stem_text = stemData.stem_text;
                        question.stem_html = stemData.stem_html;
                        questionsPatched++;
                        console.log(`✓ Question ${question.question_id} patched successfully`);
                    } else {
                        errors++;
                        console.log(`✗ Failed to extract stem data for question ${question.question_id}`);
                    }
                } else {
                    errors++;
                    console.log(`✗ Failed to fetch question ${question.question_id}`);
                }

                // Add delay between requests
                await sleep(REQUEST_DELAY_MS);
            }
        }

        // In test mode, break out of exam loop too if we've reached the limit
        if (testMode && questionsPatched >= maxQuestions) {
            break;
        }
    }

    // Save the updated data
    saveJsonFile(data);

    // Print summary
    console.log('\n=== PATCHING SUMMARY ===');
    console.log(`Total questions processed: ${totalQuestions}`);
    console.log(`Questions needing patch: ${questionsNeedingPatch}`);
    console.log(`Questions successfully patched: ${questionsPatched}`);
    console.log(`Errors encountered: ${errors}`);
    console.log(`Success rate: ${questionsNeedingPatch > 0 ? ((questionsPatched / questionsNeedingPatch) * 100).toFixed(1) : 0}%`);

    if (questionsPatched > 0) {
        console.log(`\nPatching completed! Updated file saved.`);
        console.log(`Backup available at: ${BACKUP_FILE_PATH}`);
    }
}

/**
 * Dry run to identify questions that need patching without making changes
 */
function dryRun() {
    console.log('Running dry run to identify questions needing patches...');

    const data = loadJsonFile();
    let totalQuestions = 0;
    let questionsNeedingPatch = 0;
    const questionIds = [];

    for (const exam of data.exams) {
        for (const question of exam.questions) {
            totalQuestions++;

            if (needsPatching(question)) {
                questionsNeedingPatch++;
                questionIds.push(question.question_id);
                const stemPreview = question.stem_text ? question.stem_text.substring(0, 100) : '(empty)';
                console.log(`Question ${question.question_id} needs patching - stem_text: "${stemPreview}..."`);
            }
        }
    }

    console.log('\n=== DRY RUN SUMMARY ===');
    console.log(`Total questions: ${totalQuestions}`);
    console.log(`Questions needing patch: ${questionsNeedingPatch}`);
    console.log(`Question IDs: ${questionIds.join(', ')}`);
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

if (command === 'dry-run' || command === '--dry-run') {
    dryRun();
} else if (command === 'test') {
    const maxQuestions = parseInt(args[1]) || 3;
    patchJsonFile(true, maxQuestions).catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
} else if (command === 'patch' || !command) {
    patchJsonFile().catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
} else {
    console.log('Usage:');
    console.log('  node patch-oneprep.js [command] [options]');
    console.log('');
    console.log('Commands:');
    console.log('  patch       Patch the JSON file (default)');
    console.log('  test [N]    Test mode - patch only N questions (default: 3)');
    console.log('  dry-run     Identify questions needing patches without making changes');
}
