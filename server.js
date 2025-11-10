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

// Attach DB to app for testing purposes
app.db = db;

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
    UNIQUE(voter_email, election_id),
    FOREIGN KEY(voter_email) REFERENCES users(email),
    FOREIGN KEY(election_id) REFERENCES elections(id),
    FOREIGN KEY(candidate_id) REFERENCES candidates(id)
  )`);
});

// --- MIDDLEWARE ---

// Authentication Middleware: Verifies JWT and loads user data
function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      // We attach the decoded payload (containing user info) to the request
      req.user = payload; 
      return next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
  return res.status(401).json({ error: 'Authorization token required' });
}

// Authorization Middleware: Checks if the user is an admin
function adminMiddleware(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
}

// --- AUTH ROUTES ---

app.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  app.db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'Email not found' });
    const resetToken = jwt.sign({ email, purpose: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
    const expires = new Date(Date.now() + 3600000).toISOString();
    app.db.run('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [resetToken, expires, email], function (uerr) {
      if (uerr) return res.status(500).json({ error: 'Database error' });
      // Removed demo token exposure. In a real app, reset instructions are emailed.
      res.json({ message: 'Password reset instructions sent' });
    });
  });
});

app.post('/auth/reset-password', (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) return res.status(400).json({ error: 'Reset token and new password required' });
  try {
    const decoded = jwt.verify(resetToken, JWT_SECRET);
    if (decoded.purpose !== 'reset') return res.status(400).json({ error: 'Invalid reset token purpose' });
    app.db.get('SELECT email, reset_token, reset_token_expires FROM users WHERE email = ?', [decoded.email], (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user || user.reset_token !== resetToken) return res.status(400).json({ error: 'Invalid reset token' });
      if (user.reset_token_expires && new Date(user.reset_token_expires) < new Date()) return res.status(400).json({ error: 'Reset token has expired' });
      const hash = bcrypt.hashSync(newPassword, 10);
      app.db.run('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?', [hash, decoded.email], function (uerr) {
        if (uerr) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Password reset successful' });
      });
    });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }
});

// Existing /auth/register and /auth/login remain as is
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

// --- PUBLIC ROUTES (FOR ANY AUTHENTICATED USER) ---

// 1. Get all elections (used by Dashboard, VotePage, ResultsPage)
app.get('/elections', authMiddleware, (req, res) => {
  app.db.all('SELECT id, title, description FROM elections', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 2. Get candidates for a specific election (used by VotePage, AdminPage, Dashboard)
app.get('/candidates/:electionId', authMiddleware, (req, res) => {
  const { electionId } = req.params;
  app.db.all('SELECT id, election_id, name FROM candidates WHERE election_id = ?', [electionId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 3. Cast a vote (used by VotePage)
app.post('/vote', authMiddleware, (req, res) => {
  const { election_id, candidate_id } = req.body;
  const voter_email = req.user.email; // Get email from authenticated user payload

  if (!election_id || !candidate_id) return res.status(400).json({ error: 'Election ID and Candidate ID required' });

  // Insert vote with UNIQUE constraint handling
  app.db.run('INSERT INTO votes (voter_email, election_id, candidate_id) VALUES (?, ?, ?)', 
    [voter_email, election_id, candidate_id], 
    function (err) {
      if (err && err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'You have already voted in this election' });
      }
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Your vote was recorded', vote_id: this.lastID });
    }
  );
});

// 4. Get all votes (used by Dashboard stats)
app.get('/all-votes', authMiddleware, (req, res) => {
  app.db.all('SELECT id, voter_email, election_id, candidate_id FROM votes', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 5. Get aggregated results for a specific election (used by ResultsPage)
app.get('/results/:electionId', authMiddleware, (req, res) => {
  const { electionId } = req.params;
  const sql = `
    SELECT
      c.name AS candidate_name,
      COUNT(v.id) AS total_votes
    FROM candidates c
    LEFT JOIN votes v ON c.id = v.candidate_id
    WHERE c.election_id = ?
    GROUP BY c.id, c.name
    ORDER BY total_votes DESC
  `;
  app.db.all(sql, [electionId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ election_id: electionId, results: rows });
  });
});


// --- ADMIN ROUTES (REQUIRES AUTH AND ADMIN ROLE) ---

// 6. Get all users (used by AdminPage)
app.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  app.db.all('SELECT id, name, email, role FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 7. Create new election (used by AdminPage)
app.post('/elections/create', authMiddleware, adminMiddleware, (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  app.db.run('INSERT INTO elections (title, description) VALUES (?, ?)', [title, description], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Election created', id: this.lastID });
  });
});

// 8. Add candidate (used by AdminPage)
app.post('/candidates/add', authMiddleware, adminMiddleware, (req, res) => {
  const { election_id, name } = req.body;
  if (!election_id || !name) return res.status(400).json({ error: 'Election ID and candidate name required' });
  app.db.run('INSERT INTO candidates (election_id, name) VALUES (?, ?)', [election_id, name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Candidate added', id: this.lastID });
  });
});

// 9. Delete election (used by AdminPage)
app.delete('/election/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  app.db.serialize(() => {
    app.db.run('DELETE FROM votes WHERE election_id = ?', [id]);
    app.db.run('DELETE FROM candidates WHERE election_id = ?', [id]);
    app.db.run('DELETE FROM elections WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Election not found' });
      res.json({ message: 'Election deleted' });
    });
  });
});

// 10. Delete candidate (used by AdminPage)
app.delete('/candidate/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  app.db.serialize(() => {
    app.db.run('DELETE FROM votes WHERE candidate_id = ?', [id]);
    app.db.run('DELETE FROM candidates WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Candidate not found' });
      res.json({ message: 'Candidate deleted' });
    });
  });
});

// 11. Delete user (used by AdminPage)
app.delete('/user/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  app.db.serialize(() => {
    app.db.get('SELECT email FROM users WHERE id = ?', [id], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      app.db.run('DELETE FROM votes WHERE voter_email = ?', [user.email]);
      
      app.db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User deleted' });
      });
    });
  });
});

// 12. Change role to Admin (used by AdminPage, fixed to use ID)
app.post('/make-admin', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'User ID required' });
  app.db.run("UPDATE users SET role = 'admin' WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User promoted to admin' });
  });
});

// 13. Change role to Voter (used by AdminPage, new route)
app.post('/make-voter', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'User ID required' });
  app.db.run("UPDATE users SET role = 'voter' WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User demoted to voter' });
  });
});

// Fallback for client-side routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
  });
}

// Removed the old getRequestUser helper as it's no longer needed.

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));