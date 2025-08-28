import pg from 'pg';
import { config } from './config.js';
import { logger } from './logger.js';

const { Pool } = pg;

class DatabaseManager {
      constructor() {
    // Use DATABASE_URL if available, otherwise use individual components
    const connectionConfig = config.db.url ? {
      connectionString: config.db.url,
      ssl: {
        rejectUnauthorized: false
      }
    } : {
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
      ssl: {
        rejectUnauthorized: false
      }
    };

    this.pool = new Pool({
      ...connectionConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

        this.pool.on('error', (err) => {
            logger.error('Unexpected error on idle client', err);
            process.exit(-1);
        });
    }

    async connect() {
        try {
            const client = await this.pool.connect();
            logger.info('Database connected successfully');
            client.release();
            return true;
        } catch (err) {
            logger.error('Database connection failed:', err);
            throw err;
        }
    }

    async enableServiceMode() {
        const client = await this.pool.connect();
        try {
            await client.query('SELECT enable_service_mode()');
            logger.info('Service mode enabled (RLS bypassed)');
        } catch (err) {
            logger.error('Failed to enable service mode:', err);
            throw err;
        } finally {
            client.release();
        }
    }

    async disableServiceMode() {
        const client = await this.pool.connect();
        try {
            await client.query('SELECT disable_service_mode()');
            logger.info('Service mode disabled (RLS re-enabled)');
        } catch (err) {
            logger.error('Failed to disable service mode:', err);
            throw err;
        } finally {
            client.release();
        }
    }

    async batchInsert(tableName, columns, rows, batchSize = 1000) {
        if (!rows || rows.length === 0) {
            logger.warn(`No rows to insert into ${tableName}`);
            return 0;
        }

        const client = await this.pool.connect();
        let totalInserted = 0;

        try {
            await client.query('BEGIN');

            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);
                const placeholders = batch.map((_, idx) => {
                    const start = idx * columns.length + 1;
                    const end = start + columns.length - 1;
                    return `(${Array.from({ length: columns.length }, (_, j) => `$${start + j}`).join(', ')})`;
                }).join(', ');

                const query = `
          INSERT INTO ${tableName} (${columns.join(', ')})
          VALUES ${placeholders}
          ON CONFLICT (question_id) DO NOTHING
        `;

                const values = batch.flat();

                try {
                    const result = await client.query(query, values);
                    totalInserted += result.rowCount;
                    logger.debug(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${result.rowCount} rows`);
                } catch (err) {
                    logger.error(`Batch insert failed for ${tableName}:`, err);
                    logger.error('Query:', query);
                    logger.error('Values sample:', values.slice(0, 10));
                    throw err;
                }
            }

            await client.query('COMMIT');
            logger.info(`Successfully inserted ${totalInserted} rows into ${tableName}`);
            return totalInserted;

        } catch (err) {
            await client.query('ROLLBACK');
            logger.error(`Transaction rolled back for ${tableName}:`, err);
            throw err;
        } finally {
            client.release();
        }
    }

    async query(text, params) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(text, params);
            return result;
        } catch (err) {
            logger.error('Query failed:', err);
            throw err;
        } finally {
            client.release();
        }
    }

    async getTableCount(tableName) {
        try {
            const result = await this.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            return parseInt(result.rows[0].count);
        } catch (err) {
            logger.error(`Failed to get count for ${tableName}:`, err);
            return 0;
        }
    }

    async close() {
        await this.pool.end();
        logger.info('Database connections closed');
    }
}

export const db = new DatabaseManager();
