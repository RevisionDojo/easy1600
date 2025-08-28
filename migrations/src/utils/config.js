import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenvConfig({ path: join(__dirname, '../../.env') });

export const config = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        name: process.env.DB_NAME || 'sat_prep',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        url: process.env.DATABASE_URL
    },

    migration: {
        batchSize: parseInt(process.env.BATCH_SIZE) || 1000,
        maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
        logLevel: process.env.LOG_LEVEL || 'info'
    },

    files: {
        allExams: process.env.ALLEXAMS_FILE || '../ALLEXAMSONEPREP.json',
        onePrep: process.env.ONEPREP_FILE || '../oneprep_sat_suite_questionbank.json',
        princeton: process.env.PRINCETON_FILE || '../princetonreview.json',
        bluebookDir: process.env.BLUEBOOK_DIR || '../bluebookplus_tests_output',
        bluebookIndex: process.env.BLUEBOOK_INDEX || '../bluebookplus_tests_output/index.json'
    }
};

// Validate required configuration
const requiredDbFields = ['host', 'port', 'name', 'user'];
for (const field of requiredDbFields) {
    if (!config.db[field]) {
        throw new Error(`Missing required database configuration: DB_${field.toUpperCase()}`);
    }
}
