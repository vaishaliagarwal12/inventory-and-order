import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  console.log(`🚀 Reading schema file from: ${schemaPath}`);

  try {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('⏳ Executing schema migration...');
    await pool.query(sql);
    console.log('✅ Schema migration completed successfully!');
  } catch (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runMigration();
