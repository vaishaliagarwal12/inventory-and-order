import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Support either full DATABASE_URL or individual connection parameters
const dbConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'inventory_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

export const pool = new Pool({
  ...dbConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/**
 * Tests the PostgreSQL connection without throwing uncaught exceptions.
 * @returns {Promise<{connected: boolean, message: string, timestamp?: string}>}
 */
export const testDbConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    return {
      connected: true,
      message: 'PostgreSQL database connected successfully',
      timestamp: result.rows[0].current_time,
    };
  } catch (error) {
    return {
      connected: false,
      message: `Database connection error: ${error.message}`,
    };
  }
};
