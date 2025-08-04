import { initDatabase, getDb } from './bot/utils/database.js';

async function populateTestData() {
  try {
    console.log("🟢 Initializing database...");
    await initDatabase();
    const db = getDb();

    console.log("👤 Inserting test users...");
    await db.run('INSERT INTO users (user_id, username, first_name, is_verified) VALUES (?, ?, ?, ?)', [101, 'student1', 'Ali', 1]);
    await db.run('INSERT INTO users (user_id, username, first_name, is_verified) VALUES (?, ?, ?, ?)', [102, 'student2', 'Aya', 1]);

    console.log("📚 Inserting test course/lessons...");
    const courseId = 1;
    await db.run('INSERT INTO lessons (course_id, title, date, time, zoom_link) VALUES (?, ?, ?, ?, ?)',
      [courseId, 'Introduction to Logic', '2025-08-05', '20:00', 'https://zoom.us/test-link']);

    await db.run('INSERT INTO lessons (course_id, title, date, time, zoom_link) VALUES (?, ?, ?, ?, ?)',
      [courseId, 'Advanced Analysis', '2025-08-06', '21:00', 'https://zoom.us/test-link2']);

    console.log("📝 Inserting assignments...");
    const assignmentId = await db.run(
      'INSERT INTO assignments (course_id, title, question, correct_answer, deadline) VALUES (?, ?, ?, ?, ?)',
      [courseId, 'Logic HW 1', 'What is 2+2?', '4', '2025-08-10']
    );

    console.log("✅ Submitting answers...");
    await db.run('INSERT INTO submissions (user_id, assignment_id, answer, score) VALUES (?, ?, ?, ?)', [101, assignmentId.lastID, '4', 1]);
    await db.run('INSERT INTO submissions (user_id, assignment_id, answer, score) VALUES (?, ?, ?, ?)', [102, assignmentId.lastID, '3', 0]);

    console.log("📆 Adding attendance...");
    await db.run('INSERT INTO attendance (user_id, lesson_id) VALUES (?, ?)', [101, 1]);
    await db.run('INSERT INTO attendance (user_id, lesson_id) VALUES (?, ?)', [102, 1]);

    console.log("📊 Fetching stats...");
    const lessons = await db.all('SELECT * FROM lessons');
    const users = await db.all('SELECT * FROM users');
    const assignments = await db.all('SELECT * FROM assignments');
    const submissions = await db.all('SELECT * FROM submissions');

    console.log("📘 Lessons:", lessons);
    console.log("👥 Users:", users);
    console.log("📝 Assignments:", assignments);
    console.log("📨 Submissions:", submissions);

    console.log("🎉 Test data populated successfully.");
  } catch (error) {
    console.error("❌ Error populating test data:", error);
  }
}

populateTestData();