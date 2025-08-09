// complete-db-fix.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as fs from 'fs';

async function recreateDatabase() {
  try {
    console.log('🔧 Starting complete database recreation...');
    
    // Ensure data directory exists
    const dataDir = './data';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('📁 Created data directory');
    }

    // Backup existing database if it exists
    const dbPath = './data/mouin_almojtahidin.db';
    if (fs.existsSync(dbPath)) {
      const backupPath = `${dbPath}.backup-${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      console.log(`📋 Backed up existing database to: ${backupPath}`);
      
      // Remove the problematic database
      fs.unlinkSync(dbPath);
      console.log('🗑️ Removed problematic database file');
    }

    // Create fresh database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('🔗 Connected to fresh database');

    // Enable foreign keys and WAL mode
    await db.exec('PRAGMA foreign_keys = ON');
    await db.exec('PRAGMA journal_mode = WAL');
    console.log('⚙️ Configured database settings');

    // Create all tables with correct schema
    console.log('📝 Creating database tables...');

    // 1. Users table
    await db.exec(`
      CREATE TABLE users (
        user_id INTEGER PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_verified BOOLEAN DEFAULT 0,
        reminders_enabled BOOLEAN DEFAULT 1,
        language TEXT DEFAULT 'ar',
        notification_frequency TEXT DEFAULT 'daily'
      )
    `);
    console.log('✅ Created users table');

    // 2. Courses table
    await db.exec(`
      CREATE TABLE courses (
        course_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created courses table');

    // 3. Lessons table
    await db.exec(`
      CREATE TABLE lessons (
        lesson_id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        zoom_link TEXT,
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
      )
    `);
    console.log('✅ Created lessons table');

    // 4. Assignments table (with consistent naming)
    await db.exec(`
      CREATE TABLE assignments (
        assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        question TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        due_date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
      )
    `);
    console.log('✅ Created assignments table');

    // 5. Submissions table
    await db.exec(`
      CREATE TABLE submissions (
        user_id INTEGER,
        assignment_id INTEGER,
        answer TEXT NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        score INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, assignment_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id)
      )
    `);
    console.log('✅ Created submissions table');

    // 6. Attendance table
    await db.exec(`
      CREATE TABLE attendance (
        user_id INTEGER,
        lesson_id INTEGER,
        attended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, lesson_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id)
      )
    `);
    console.log('✅ Created attendance table');

    // 7. Custom reminders table
    await db.exec(`
      CREATE TABLE custom_reminders (
        reminder_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        reminder_datetime DATETIME NOT NULL,
        message TEXT NOT NULL,
        is_sent BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);
    console.log('✅ Created custom_reminders table');

    // 8. Announcements table
    await db.exec(`
      CREATE TABLE announcements (
        announcement_id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sent_to_group BOOLEAN DEFAULT 0
      )
    `);
    console.log('✅ Created announcements table');

    // 9. Feedback table
    await db.exec(`
      CREATE TABLE feedback (
        feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT 0,
        admin_response TEXT,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);
    console.log('✅ Created feedback table');

    // 10. Bugs table
    await db.exec(`
      CREATE TABLE bugs (
        bug_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_resolved BOOLEAN DEFAULT 0,
        admin_notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);
    console.log('✅ Created bugs table');

    // 11. Metadata table for schema versioning
    await db.exec(`
      CREATE TABLE metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
    await db.exec("INSERT INTO metadata (key, value) VALUES ('schema_version', '1')");
    console.log('✅ Created metadata table');

    // Create essential indexes for performance
    console.log('🔍 Creating performance indexes...');
    
    await db.exec('CREATE INDEX idx_assignments_due_date ON assignments(due_date)');
    await db.exec('CREATE INDEX idx_assignments_course_id ON assignments(course_id)');
    await db.exec('CREATE INDEX idx_custom_reminders_user_id ON custom_reminders(user_id)');
    await db.exec('CREATE INDEX idx_submissions_user_id ON submissions(user_id)');
    await db.exec('CREATE INDEX idx_attendance_user_id ON attendance(user_id)');
    await db.exec('CREATE INDEX idx_lessons_date ON lessons(date)');
    await db.exec('CREATE INDEX idx_users_verified ON users(is_verified)');
    
    console.log('✅ Created performance indexes');

    // Insert sample data for testing (optional)
    console.log('📊 Adding sample data...');
    
    // Sample course
    await db.exec(`
      INSERT INTO courses (name, description) 
      VALUES ('دورة تجريبية', 'دورة للاختبار والتجريب')
    `);

    // Sample lesson
    await db.exec(`
      INSERT INTO lessons (course_id, title, date, time, zoom_link) 
      VALUES (1, 'الدرس التجريبي الأول', '2024-12-20', '19:00', 'https://zoom.us/j/test')
    `);

    console.log('✅ Added sample data');

    // Verify all tables exist
    console.log('🔍 Verifying table creation...');
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    console.log('📋 Created tables:');
    tables.forEach(table => {
      console.log(`   ✓ ${table.name}`);
    });

    await db.close();
    console.log('🎉 Database recreation completed successfully!');
    console.log('🚀 You can now run: npm start');

  } catch (error) {
    console.error('❌ Error recreating database:', error);
    process.exit(1);
  }
}

recreateDatabase();