import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '5432', 10);
const dbName = process.env.DB_NAME || 'inventory_db';
const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || 'postgres';

async function initDb() {
  // Connect to default 'postgres' database first
  const pool = new pg.Pool({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  try {
    console.log(`🔌 Connecting to default PostgreSQL instance at ${host}:${port}...`);
    
    // Ensure postgres user has password set as specified in .env
    await pool.query(`ALTER USER "${user}" WITH PASSWORD '${password.replace(/'/g, "''")}';`);
    console.log(`🔑 Verified/updated password for user '${user}'.`);

    // Check if target database exists
    const checkDb = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (checkDb.rows.length === 0) {
      console.log(`📦 Database '${dbName}' does not exist. Creating...`);
      await pool.query(`CREATE DATABASE "${dbName}";`);
      console.log(`✅ Database '${dbName}' created successfully.`);
    } else {
      console.log(`ℹ️ Database '${dbName}' already exists.`);
    }
  } catch (error) {
    console.error(`❌ Failed to initialize database: ${error.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDb();
