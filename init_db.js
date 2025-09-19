// init_db.js
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcrypt');

(async () => {
  const db = await open({ filename: './lms.db', driver: sqlite3.Database });

  // Create tables
  await db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      title TEXT,
      teacher_id INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(teacher_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER,
      user_id INTEGER,
      role_in_course TEXT,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(course_id) REFERENCES courses(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER,
      title TEXT,
      file_path TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(course_id) REFERENCES courses(id)
    );
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER,
      title TEXT,
      description TEXT,
      due_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(course_id) REFERENCES courses(id)
    );
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER,
      student_id INTEGER,
      file_path TEXT,
      text_answer TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      score REAL,
      feedback TEXT,
      FOREIGN KEY(assignment_id) REFERENCES assignments(id),
      FOREIGN KEY(student_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER,
      title TEXT,
      start_at DATETIME,
      end_at DATETIME,
      meet_link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(course_id) REFERENCES courses(id)
    );
    CREATE TABLE IF NOT EXISTS attendances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      student_id INTEGER,
      status TEXT,
      marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      method TEXT,
      FOREIGN KEY(session_id) REFERENCES sessions(id),
      FOREIGN KEY(student_id) REFERENCES users(id)
    );
  `);

  // Seed sample users
  const password = await bcrypt.hash('123456', 10);
  try {
    await db.run(`INSERT INTO users (email, password_hash, name, role) VALUES (?,?,?,?)`,
      ['teacher@agu.edu.vn', password, 'GV Nguyễn Văn A', 'teacher']);
    await db.run(`INSERT INTO users (email, password_hash, name, role) VALUES (?,?,?,?)`,
      ['student1@agu.edu.vn', password, 'SV Trần Thị B', 'student']);
    await db.run(`INSERT INTO users (email, password_hash, name, role) VALUES (?,?,?,?)`,
      ['admin@agu.edu.vn', password, 'Admin', 'admin']);
  } catch (e) {
    console.log('Seed users: may already exist');
  }

  // Seed sample course
  const teacher = await db.get(`SELECT id FROM users WHERE email = ?`, ['teacher@agu.edu.vn']);
  if (teacher) {
    try {
      await db.run(`INSERT INTO courses (code, title, teacher_id, description) VALUES (?,?,?,?)`,
        ['CS101', 'Lập trình cơ bản', teacher.id, 'Mô tả khóa học']);
    } catch (e) {
      console.log('Seed course: may already exist');
    }
  }

  console.log('DB init done');
  await db.close();
})();
