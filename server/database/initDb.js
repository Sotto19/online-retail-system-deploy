import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function initDb() {
  console.log('--- Initializing MySQL Database ---');
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'retail_db';

  try {
    // 1. Connect without database first to ensure database creation
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    console.log(`Connected to MySQL server at ${host}:${port}`);

    // Read and run schema
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log(`Executing schema: ${schemaPath}`);
    await connection.query(schemaSql);
    console.log('✓ Schema created successfully!');

    // Read and run seeds
    const seedPath = path.resolve(__dirname, 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    console.log(`Executing seeds: ${seedPath}`);
    await connection.query(seedSql);
    console.log('✓ Seed data inserted successfully!');

    await connection.end();
    console.log('\nDatabase initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('Please ensure your MySQL server is running and your credentials in server/.env are correct.');
    process.exit(1);
  }
}

initDb();
