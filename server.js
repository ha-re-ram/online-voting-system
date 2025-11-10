const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
}

// Database (file-based sqlite)
const dbPath = path.resolve(__dirname, 'voting.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error connecting to DB', err);
  else console.log('Connected to SQLite database.');
});

// Ensure tables exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'voter',
    password_hash TEXT,
    reset_token TEXT,
    reset_token_expires TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS elections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    start_date TEXT,
    end_date TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    election_id INTEGER,
    name TEXT NOT NULL,
    FOREIGN KEY(election_id) REFERENCES elections(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    voter_email TEXT NOT NULL,
    election_id INTEGER NOT NULL,
    candidate_id INTEGER NOT NULL,
    FOREIGN KEY(voter_email) REFERENCES users(email),
    FOREIGN KEY(election_id) REFERENCES elections(id),
    FOREIGN KEY(candidate_id) REFERENCES candidates(id)
  )`);
});

// Helper: get user by auth token or email
function getRequestUser(req, cb) {
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      return db.get('SELECT id,name,email,role FROM users WHERE id = ?', [payload.id], cb);
    } catch (e) {
      return cb(null, null);
    }
  }
  const email = req.body.email || req.query.email;
  if (!email) return cb(null, null);
  db.get('SELECT id,name,email,role FROM users WHERE email = ?', [email], cb);
}

// AUTH
app.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'Email not found' });
    const resetToken = jwt.sign({ email, purpose: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
    const expires = new Date(Date.now() + 3600000).toISOString();
    db.run('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [resetToken, expires, email], function (uerr) {
      if (uerr) return res.status(500).json({ error: 'Database error' });
      // Demo: return token. In production, send email instead.
      res.json({ message: 'Password reset instructions sent', resetToken });
    });
  });
});

app.post('/auth/reset-password', (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) return res.status(400).json({ error: 'Reset token and new password required' });
  try {
    const decoded = jwt.verify(resetToken, JWT_SECRET);
    if (decoded.purpose !== 'reset') return res.status(400).json({ error: 'Invalid reset token' });
    db.get('SELECT email, reset_token, reset_token_expires FROM users WHERE email = ?', [decoded.email], (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user || user.reset_token !== resetToken) return res.status(400).json({ error: 'Invalid or expired reset token' });
      if (user.reset_token_expires && new Date(user.reset_token_expires) < new Date()) return res.status(400).json({ error: 'Reset token has expired' });
      const hash = bcrypt.hashSync(newPassword, 10);
      db.run('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?', [hash, decoded.email], function (uerr) {
        if (uerr) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Password reset successful' });
      });
    });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid reset token' });
  }
});

app.post('/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password required' });
  const hash = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)', [name, email, role || 'voter', hash], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    const user = { id: this.lastID, name, email, role: role || 'voter' };
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ message: 'registered', user, token });
  });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  db.get('SELECT id, name, email, role, password_hash FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.password_hash) return res.status(400).json({ error: 'User has no password (legacy account)' });
    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ message: 'Login ok', user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  });
});

// Minimal admin endpoints
app.post('/make-admin', (req, res) => {
  const { email } = req.body;
  db.run("UPDATE users SET role = 'admin' WHERE email = ?", [email], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User promoted to admin' });
  });
});

app.get('/users', (req, res) => {
  db.all('SELECT id, name, email, role FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
