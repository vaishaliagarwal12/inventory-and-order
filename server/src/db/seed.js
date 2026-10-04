import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  const seedPath = path.join(__dirname, 'seed.sql');
  console.log(`🌱 Reading seed file from: ${seedPath}`);

  try {
    const sql = fs.readFileSync(seedPath, 'utf8');
    console.log('⏳ Executing database seed...');
    await pool.query(sql);
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runSeed();
