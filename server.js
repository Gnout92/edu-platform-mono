// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const PORT = process.env.PORT || 5500;
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
const SESSION_SECRET = process.env.SESSION_SECRET || 'default_session_secret';
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || 'http://localhost:5500,http://education.edu.vn:5500').split(',');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

(async () => {
  const db = await open({ filename: './lms.db', driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const app = express();
  app.use(express.json());

  // CORS
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (FRONTEND_ORIGINS.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error('CORS not allowed by server'));
    },
    credentials: true
  }));

  // Session & Passport
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  // Google Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

      if (!user) {
        const hash = await bcrypt.hash('random-pass', 10);
        const result = await db.run(
          'INSERT INTO users (email, password_hash, name, role) VALUES (?,?,?,?)',
          [email, hash, profile.displayName, 'student']
        );
        user = { id: result.lastID, email, name: profile.displayName, role: 'student' };
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '8h' }
      );
      return done(null, { ...user, token });
    } catch (err) {
      done(err);
    }
  }));

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  // ================= API LOGIN/REGISTER =================
  app.post('/api/register', async (req, res) => {
    const { email, password, name, role = 'student' } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, name required' });

    try {
      const hash = await bcrypt.hash(password, 10);
      const r = await db.run('INSERT INTO users (email, password_hash, name, role) VALUES (?,?,?,?)',
        [email, hash, name, role]);
      res.json({ id: r.lastID });
    } catch {
      res.status(400).json({ error: 'Email already exists' });
    }
  });

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user });
  });

  // ================= Google OAuth =================
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
      return res.redirect(`/dashboard.html?token=${req.user.token}`);
    }
  );

  app.get('/auth/logout', (req, res, next) => {
    req.logout(err => { if (err) return next(err); });
    req.session.destroy();
    res.redirect('/');
  });

  // ================= Frontend =================
  const frontendDir = path.join(__dirname, 'frontend');
  app.use('/uploads', express.static(uploadDir));
  if (fs.existsSync(frontendDir)) {
    app.use(express.static(frontendDir));
    app.get('/', (req, res) => res.sendFile(path.join(frontendDir, 'index.html')));
    app.get('/dashboard.html', (req, res) => res.sendFile(path.join(frontendDir, 'dashboard.html')));
  }

  // ================= Start server =================
  app.listen(PORT, () => {
    console.log(`✅ Server started at http://localhost:${PORT}`);
  });
})();
