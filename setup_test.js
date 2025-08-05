// setup_test.js
// Script to populate the database with test data for Mouin-Almojtahidin-bot

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';

async function setupTestData() {
  try {
    console.log('🔄 Setting up test data...');
    
    // Open database connection
    const db = await open({
      filename: './data/mouin_almojtahidin.db',
      driver: sqlite3.Database
    });

    // Read and execute test data SQL
    const testDataSql = fs.readFileSync('./test_data.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = testDataSql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.exec(statement);
        } catch (error) {
          console.warn(`Warning executing statement: ${error.message}`);
        }
      }
    }

    // Verify data was inserted
    const courseCount = await db.get('SELECT COUNT(*) as count FROM courses');
    const lessonCount = await db.get('SELECT COUNT(*) as count FROM lessons');
    const assignmentCount = await db.get('SELECT COUNT(*) as count FROM assignments');
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');

    console.log('✅ Test data setup complete!');
    console.log(`📚 Courses: ${courseCount.count}`);
    console.log(`📖 Lessons: ${lessonCount.count}`);
    console.log(`📝 Assignments: ${assignmentCount.count}`);
    console.log(`👥 Users: ${userCount.count}`);

    await db.close();
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTestData();
}

export { setupTestData };