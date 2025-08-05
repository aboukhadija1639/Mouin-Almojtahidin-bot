import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as fs from 'fs';
import { config } from '../../config.js';
import { promisify } from 'util';


let db = null;

// Ensure data directory exists
export function ensureDataDirectoryExists() {
  const dataDir = './data';
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// getAssignments
export async function getAssignments() {
  try {
    const assignments = await db.all('SELECT * FROM assignments ORDER BY assignment_id DESC');
    return assignments;
  } catch (error) {
    console.error('خطأ في جلب الواجبات:', error);
    return [];
  }
}

// Initialize database connection and create tables
export async function initDatabase() {
  try {
    // Ensure data directory and log files exist before any database operations
    ensureDataDirectoryExists();
    ensureLogFiles();
    
    db = await open({
      filename: './data/mouin_almojtahidin.db',
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');

    // Create tables
    await createTables();
    
    console.log('✅ قاعدة البيانات متصلة بنجاح');
    return db;
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
    throw error;
  }
}

// Ensure log files exist (duplicated from logger for independent operation)
function ensureLogFiles() {
  const logDir = './data';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const combinedLogFile = './data/combined.log';
  const errorLogFile = './data/error.log';
  
  if (!fs.existsSync(combinedLogFile)) {
    fs.writeFileSync(combinedLogFile, '');
  }
  
  if (!fs.existsSync(errorLogFile)) {
    fs.writeFileSync(errorLogFile, '');
  }
}

// Create database tables
async function createTables() {
  try {
    // Users table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_verified BOOLEAN DEFAULT 0,
        reminders_enabled BOOLEAN DEFAULT 1,
        language TEXT DEFAULT 'ar'
      )
    `);

    // Lessons table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS lessons (
        lesson_id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        zoom_link TEXT
      )
    `);

    // Attendance table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS attendance (
        user_id INTEGER,
        lesson_id INTEGER,
        attended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, lesson_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id)
      )
    `);

    // Announcements table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS announcements (
        announcement_id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sent_to_group BOOLEAN DEFAULT 0
      )
    `);

    // Assignments table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS assignments (
        assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        question TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        deadline TEXT
      )
    `);

    // Submissions table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS submissions (
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

    // Custom reminders table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS custom_reminders (
        reminder_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        reminder_datetime DATETIME NOT NULL,
        message TEXT NOT NULL,
        is_sent BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);

    // Feedback table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS feedback (
        feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT 0,
        admin_response TEXT,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);

    // Bugs table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS bugs (
        bug_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_resolved BOOLEAN DEFAULT 0,
        admin_notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);

    console.log('✅ تم إنشاء جداول قاعدة البيانات بنجاح');
  } catch (error) {
    console.error('❌ خطأ في إنشاء الجداول:', error);
    throw error;
  }
}

// User functions
export async function addUser(userId, username, firstName) {
  try {
    await db.run(
      'INSERT OR REPLACE INTO users (user_id, username, first_name) VALUES (?, ?, ?)',
      [userId, username, firstName]
    );
    return true;
  } catch (error) {
    console.error('خطأ في إضافة المستخدم:', error);
    return false;
  }
}

export async function getUserInfo(userId) {
  try {
    const user = await db.get('SELECT * FROM users WHERE user_id = ?', [userId]);
    return user;
  } catch (error) {
    console.error('خطأ في جلب معلومات المستخدم:', error);
    return null;
  }
}

export async function isUserVerified(userId) {
  try {
    const user = await db.get('SELECT is_verified FROM users WHERE user_id = ?', [userId]);
    return user ? Boolean(user.is_verified) : false;
  } catch (error) {
    console.error('خطأ في التحقق من حالة المستخدم:', error);
    return false;
  }
}

export async function verifyUser(userId) {
  try {
    await db.run('UPDATE users SET is_verified = 1 WHERE user_id = ?', [userId]);
    return true;
  } catch (error) {
    console.error('خطأ في تفعيل المستخدم:', error);
    return false;
  }
}

export async function isUserAdmin(userId) {
  return config.admin.userIds.includes(userId);
}

export async function toggleUserReminders(userId) {
  try {
    const user = await getUserInfo(userId);
    if (!user) {
      return { success: false, message: 'المستخدم غير موجود' };
    }
    
    const newReminderStatus = !user.reminders_enabled;
    await db.run('UPDATE users SET reminders_enabled = ? WHERE user_id = ?', [newReminderStatus ? 1 : 0, userId]);
    
    return {
      success: true,
      remindersEnabled: newReminderStatus,
      message: newReminderStatus ? 'تم تفعيل التذكيرات' : 'تم إيقاف التذكيرات'
    };
  } catch (error) {
    console.error('خطأ في تبديل التذكيرات:', error);
    return { success: false, message: 'حدث خطأ في تحديث التذكيرات' };
  }
}

// Lesson functions
export async function getLessons() {
  try {
    const lessons = await db.all('SELECT * FROM lessons ORDER BY date, time');
    return lessons;
  } catch (error) {
    console.error('خطأ في جلب الدروس:', error);
    return [];
  }
}

export async function getLesson(lessonId) {
  try {
    const lesson = await db.get('SELECT * FROM lessons WHERE lesson_id = ?', [lessonId]);
    return lesson;
  } catch (error) {
    console.error('خطأ في جلب الدرس:', error);
    return null;
  }
}

// Attendance functions
export async function addAttendance(userId, lessonId) {
  try {
    await db.run(
      'INSERT OR REPLACE INTO attendance (user_id, lesson_id) VALUES (?, ?)',
      [userId, lessonId]
    );
    return true;
  } catch (error) {
    console.error('خطأ في تسجيل الحضور:', error);
    return false;
  }
}

export async function getUserAttendance(userId) {
  try {
    const attendance = await db.all(
      'SELECT COUNT(*) as count FROM attendance WHERE user_id = ?',
      [userId]
    );
    return attendance[0]?.count || 0;
  } catch (error) {
    console.error('خطأ في جلب حضور المستخدم:', error);
    return 0;
  }
}

// Announcement functions
export async function addAnnouncement(content, sentToGroup = false) {
  try {
    const result = await db.run(
      'INSERT INTO announcements (content, sent_to_group) VALUES (?, ?)',
      [content, sentToGroup ? 1 : 0]
    );
    return result.lastID;
  } catch (error) {
    console.error('خطأ في إضافة الإعلان:', error);
    return null;
  }
}

// Assignment functions
export async function addAssignment(courseId, title, question, correctAnswer, deadline) {
  try {
    const result = await db.run(
      'INSERT INTO assignments (course_id, title, question, correct_answer, deadline) VALUES (?, ?, ?, ?, ?)',
      [courseId, title, question, correctAnswer, deadline]
    );
    return result.lastID;
  } catch (error) {
    console.error('خطأ في إضافة الواجب:', error);
    return null;
  }
}

export async function updateAssignment(assignmentId, field, value) {
  try {
    const validFields = ['title', 'question', 'correct_answer', 'deadline'];
    if (!validFields.includes(field)) {
      throw new Error('حقل غير صالح');
    }
    
    await db.run(
      `UPDATE assignments SET ${field} = ? WHERE assignment_id = ?`,
      [value, assignmentId]
    );
    return true;
  } catch (error) {
    console.error('خطأ في تحديث الواجب:', error);
    return false;
  }
}

export async function deleteAssignment(assignmentId) {
  try {
    // Start transaction to ensure data consistency
    await db.run('BEGIN TRANSACTION');
    
    // First, delete dependent submissions
    await db.run('DELETE FROM submissions WHERE assignment_id = ?', [assignmentId]);
    
    // Then delete the assignment
    const result = await db.run('DELETE FROM assignments WHERE assignment_id = ?', [assignmentId]);
    
    // Commit transaction
    await db.run('COMMIT');
    
    // Check if assignment was actually deleted
    if (result.changes === 0) {
      console.warn(`No assignment found with ID: ${assignmentId}`);
      return false;
    }
    
    console.log(`Successfully deleted assignment ${assignmentId} and its ${result.changes} submissions`);
    return true;
  } catch (error) {
    // Rollback transaction on error
    try {
      await db.run('ROLLBACK');
    } catch (rollbackError) {
      console.error('خطأ في التراجع عن المعاملة:', rollbackError);
    }
    console.error('خطأ في حذف الواجب:', error);
    return false;
  }
}

export async function getAssignment(assignmentId) {
  try {
    const assignment = await db.get('SELECT * FROM assignments WHERE assignment_id = ?', [assignmentId]);
    return assignment;
  } catch (error) {
    console.error('خطأ في جلب الواجب:', error);
    return null;
  }
}

export async function getAllAssignments() {
  try {
    const assignments = await db.all('SELECT * FROM assignments ORDER BY assignment_id DESC');
    return assignments;
  } catch (error) {
    console.error('خطأ في جلب جميع الواجبات:', error);
    return [];
  }
}

export async function submitAnswer(userId, assignmentId, answer) {
  try {
    const assignment = await getAssignment(assignmentId);
    if (!assignment) {
      return { success: false, message: 'الواجب غير موجود' };
    }

    const score = answer.trim().toLowerCase() === assignment.correct_answer.trim().toLowerCase() ? 1 : 0;
    
    await db.run(
      'INSERT OR REPLACE INTO submissions (user_id, assignment_id, answer, score) VALUES (?, ?, ?, ?)',
      [userId, assignmentId, answer, score]
    );
    
    return {
      success: true,
      score,
      correctAnswer: assignment.correct_answer,
      message: score === 1 ? '✅ إجابة صحيحة!' : '❌ إجابة خاطئة'
    };
  } catch (error) {
    console.error('خطأ في إرسال الإجابة:', error);
    return { success: false, message: 'حدث خطأ في إرسال الإجابة' };
  }
}

export async function getUserSubmissions(userId) {
  try {
    const submissions = await db.all(
      'SELECT COUNT(*) as count FROM submissions WHERE user_id = ?',
      [userId]
    );
    return submissions[0]?.count || 0;
  } catch (error) {
    console.error('خطأ في جلب إرسالات المستخدم:', error);
    return 0;
  }
}

// Statistics functions
export async function getStats() {
  try {
    // Check if tables exist before querying
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      console.warn('بعض الجداول غير موجودة، سيتم إرجاع إحصائيات فارغة');
      return {
        totalUsers: 0,
        verifiedUsers: 0,
        attendanceByLesson: [],
        submissionsByAssignment: []
      };
    }

    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    const verifiedUsers = await db.get('SELECT COUNT(*) as count FROM users WHERE is_verified = 1');
    
    const attendanceByLesson = await db.all(`
      SELECT l.lesson_id, l.title, COUNT(a.user_id) as attendance_count,
             (SELECT COUNT(*) FROM users WHERE is_verified = 1) as total_verified
      FROM lessons l
      LEFT JOIN attendance a ON l.lesson_id = a.lesson_id
      GROUP BY l.lesson_id, l.title
    `);
    
    const submissionsByAssignment = await db.all(`
      SELECT assign.assignment_id, assign.title, COUNT(s.user_id) as submission_count,
             (SELECT COUNT(*) FROM users WHERE is_verified = 1) as total_verified
      FROM assignments assign
      LEFT JOIN submissions s ON assign.assignment_id = s.assignment_id
      GROUP BY assign.assignment_id, assign.title
    `);

    return {
      totalUsers: totalUsers?.count || 0,
      verifiedUsers: verifiedUsers?.count || 0,
      attendanceByLesson: attendanceByLesson || [],
      submissionsByAssignment: submissionsByAssignment || []
    };
  } catch (error) {
    console.error('خطأ في جلب الإحصائيات:', error);
    return {
      totalUsers: 0,
      verifiedUsers: 0,
      attendanceByLesson: [],
      submissionsByAssignment: []
    };
  }
}

// Check if all required tables exist
async function checkTablesExist() {
  try {
    const requiredTables = ['users', 'lessons', 'attendance', 'assignments', 'submissions'];
    
    for (const table of requiredTables) {
      const result = await db.get(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [table]
      );
      if (!result) {
        console.warn(`الجدول ${table} غير موجود`);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('خطأ في فحص وجود الجداول:', error);
    return false;
  }
}

// Get all verified users with reminders enabled
export async function getVerifiedUsersWithReminders() {
  try {
    const users = await db.all('SELECT user_id FROM users WHERE is_verified = 1 AND reminders_enabled = 1');
    return users.map(user => user.user_id);
  } catch (error) {
    console.error('خطأ في جلب المستخدمين للتذكيرات:', error);
    return [];
  }
}

// Course management functions
export async function deleteCourse(courseId) {
  try {
    // Delete related assignments first
    await db.run('DELETE FROM assignments WHERE course_id = ?', [courseId]);
    
    // Delete related submissions
    await db.run('DELETE FROM submissions WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE course_id = ?)', [courseId]);
    
    // Delete related attendance
    await db.run('DELETE FROM attendance WHERE lesson_id IN (SELECT lesson_id FROM lessons WHERE course_id = ?)', [courseId]);
    
    // Delete lessons
    const result = await db.run('DELETE FROM lessons WHERE course_id = ?', [courseId]);
    
    return result.changes > 0;
  } catch (error) {
    console.error('خطأ في حذف الكورس:', error);
    return false;
  }
}

// get db
function getDb() {
  return db;
}


export async function getCourses() {
  try {
    const courses = await db.all(`
      SELECT DISTINCT course_id, 
             COUNT(DISTINCT l.lesson_id) as lesson_count,
             COUNT(DISTINCT a.assignment_id) as assignment_count
      FROM lessons l
      LEFT JOIN assignments a ON l.course_id = a.course_id
      GROUP BY course_id
      ORDER BY course_id
    `);
    return courses;
  } catch (error) {
    console.error('خطأ في جلب الكورسات:', error);
    return [];
  }
}

// Custom reminders functions
export async function addCustomReminder(userId, dateTime, message) {
  try {
    const result = await db.run(
      'INSERT INTO custom_reminders (user_id, reminder_datetime, message, is_sent) VALUES (?, ?, ?, 0)',
      [userId, dateTime, message]
    );
    return result.lastID;
  } catch (error) {
    console.error('خطأ في إضافة تذكير مخصص:', error);
    return null;
  }
}

export async function getCustomReminders(userId) {
  try {
    const reminders = await db.all(
      'SELECT * FROM custom_reminders WHERE user_id = ? ORDER BY reminder_datetime ASC',
      [userId]
    );
    return reminders;
  } catch (error) {
    console.error('خطأ في جلب التذكيرات المخصصة:', error);
    return [];
  }
}

export async function deleteCustomReminder(reminderId, userId) {
  try {
    const result = await db.run(
      'DELETE FROM custom_reminders WHERE reminder_id = ? AND user_id = ?',
      [reminderId, userId]
    );
    return result.changes > 0;
  } catch (error) {
    console.error('خطأ في حذف التذكير المخصص:', error);
    return false;
  }
}

// Feedback functions
export async function addFeedback(userId, message) {
  try {
    const result = await db.run(
      'INSERT INTO feedback (user_id, message, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [userId, message]
    );
    return result.lastID;
  } catch (error) {
    console.error('خطأ في إضافة التغذية الراجعة:', error);
    return null;
  }
}

export async function getFeedback() {
  try {
    const feedback = await db.all(`
      SELECT f.*, u.username, u.first_name 
      FROM feedback f 
      LEFT JOIN users u ON f.user_id = u.user_id 
      ORDER BY f.created_at DESC
    `);
    return feedback;
  } catch (error) {
    console.error('خطأ في جلب التغذية الراجعة:', error);
    return [];
  }
}

// Export functions
export async function exportAttendanceData() {
  try {
    const data = await db.all(`
      SELECT u.user_id, u.username, u.first_name, l.title as lesson_title, 
             l.date, l.time, a.attended_at
      FROM users u
      LEFT JOIN attendance a ON u.user_id = a.user_id
      LEFT JOIN lessons l ON a.lesson_id = l.lesson_id
      WHERE u.is_verified = 1
      ORDER BY l.date, l.time, u.first_name
    `);
    return data;
  } catch (error) {
    console.error('خطأ في تصدير بيانات الحضور:', error);
    return [];
  }
}

export async function exportAssignmentsData() {
  try {
    const data = await db.all(`
      SELECT u.user_id, u.username, u.first_name, a.title as assignment_title,
             s.answer, s.submitted_at, s.score
      FROM users u
      LEFT JOIN submissions s ON u.user_id = s.user_id
      LEFT JOIN assignments a ON s.assignment_id = a.assignment_id
      WHERE u.is_verified = 1
      ORDER BY a.title, u.first_name
    `);
    return data;
  } catch (error) {
    console.error('خطأ في تصدير بيانات الواجبات:', error);
    return [];
  }
}

// User settings functions
export async function updateUserSettings(userId, settings) {
  try {
    const updates = [];
    const values = [];
    
    if (settings.hasOwnProperty('reminders_enabled')) {
      updates.push('reminders_enabled = ?');
      values.push(settings.reminders_enabled ? 1 : 0);
    }
    
    if (updates.length === 0) return false;
    
    values.push(userId);
    const result = await db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );
    
    return result.changes > 0;
  } catch (error) {
    console.error('خطأ في تحديث إعدادات المستخدم:', error);
    return false;
  }
}

export async function getUserSettings(userId) {
  try {
    const user = await db.get(
      'SELECT reminders_enabled, language FROM users WHERE user_id = ?',
      [userId]
    );
    return user ? {
      reminders_enabled: Boolean(user.reminders_enabled),
      language: user.language || 'ar'
    } : null;
  } catch (error) {
    console.error('خطأ في جلب إعدادات المستخدم:', error);
    return null;
  }
}

// Bug reporting functions
export async function addBugReport(userId, message) {
  try {
    const result = await db.run(
      'INSERT INTO bugs (user_id, message) VALUES (?, ?)',
      [userId, message]
    );
    return result.lastID;
  } catch (error) {
    console.error('خطأ في إضافة تقرير الخطأ:', error);
    return null;
  }
}

export async function getBugReports(limit = 50) {
  try {
    const bugs = await db.all(`
      SELECT b.*, u.username, u.first_name 
      FROM bugs b 
      JOIN users u ON b.user_id = u.user_id 
      ORDER BY b.created_at DESC 
      LIMIT ?
    `, [limit]);
    return bugs;
  } catch (error) {
    console.error('خطأ في جلب تقارير الأخطاء:', error);
    return [];
  }
}

// Enhanced feedback functions
export async function addFeedback(userId, message) {
  try {
    const result = await db.run(
      'INSERT INTO feedback (user_id, message) VALUES (?, ?)',
      [userId, message]
    );
    return result.lastID;
  } catch (error) {
    console.error('خطأ في إضافة التغذية الراجعة:', error);
    return null;
  }
}

export async function getFeedback(limit = 50) {
  try {
    const feedback = await db.all(`
      SELECT f.*, u.username, u.first_name 
      FROM feedback f 
      JOIN users u ON f.user_id = u.user_id 
      ORDER BY f.created_at DESC 
      LIMIT ?
    `, [limit]);
    return feedback;
  } catch (error) {
    console.error('خطأ في جلب التغذية الراجعة:', error);
    return [];
  }
}

// Reminder functions for new commands
export async function getUserReminders(userId) {
  try {
    const reminders = await db.all(
      'SELECT * FROM custom_reminders WHERE user_id = ? AND is_sent = 0 ORDER BY reminder_datetime ASC',
      [userId]
    );
    return reminders;
  } catch (error) {
    console.error('خطأ في جلب تذكيرات المستخدم:', error);
    return [];
  }
}

export async function deleteReminder(userId, reminderId) {
  try {
    const result = await db.run(
      'DELETE FROM custom_reminders WHERE reminder_id = ? AND user_id = ?',
      [reminderId, userId]
    );
    return result.changes > 0;
  } catch (error) {
    console.error('خطأ في حذف التذكير:', error);
    return false;
  }
}

// Lessons functions for upcoming lessons
export async function getUpcomingLessons(days = 7) {
  try {
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + days);
    
    const lessons = await db.all(`
      SELECT l.*, c.name as course_name 
      FROM lessons l 
      LEFT JOIN courses c ON l.course_id = c.course_id 
      WHERE date(l.date) BETWEEN date('now') AND date('now', '+${days} days')
      ORDER BY l.date ASC, l.time ASC
    `);
    return lessons;
  } catch (error) {
    console.error('خطأ في جلب الدروس القادمة:', error);
    return [];
  }
}

// User language functions
export async function updateUserLanguage(userId, language) {
  try {
    const result = await db.run(
      'UPDATE users SET language = ? WHERE user_id = ?',
      [language, userId]
    );
    return result.changes > 0;
  } catch (error) {
    console.error('خطأ في تحديث لغة المستخدم:', error);
    return false;
  }
}

export async function getUserLanguage(userId) {
  try {
    const user = await db.get(
      'SELECT language FROM users WHERE user_id = ?',
      [userId]
    );
    return user ? user.language || 'ar' : 'ar';
  } catch (error) {
    console.error('خطأ في جلب لغة المستخدم:', error);
    return 'ar';
  }
}

// Broadcast functions
export async function getAllVerifiedUsers() {
  try {
    const users = await db.all(
      'SELECT user_id, username, first_name FROM users WHERE is_verified = 1'
    );
    return users;
  } catch (error) {
    console.error('خطأ في جلب المستخدمين المفعلين:', error);
    return [];
  }
}

// Close database connection
export async function closeDatabase() {
  if (db) {
    await db.close();
    console.log('✅ تم إغلاق اتصال قاعدة البيانات');
  }
}

export { db, getDb};