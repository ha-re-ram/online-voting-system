-- 🗳️ Cloudflare D1 Database Schema for Online Voting System
-- Use this schema to initialize your D1 instance inside the Cloudflare dashboard or via Wrangler CLI.

DROP TABLE IF EXISTS ballots;
DROP TABLE IF EXISTS participation;
DROP TABLE IF EXISTS candidates;
DROP TABLE IF EXISTS elections;
DROP TABLE IF EXISTS users;

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'voter',
  password_hash TEXT,
  reset_token TEXT,
  reset_token_expires TEXT
);

-- 2. Create Elections Table
CREATE TABLE IF NOT EXISTS elections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  start_date TEXT,
  end_date TEXT
);

-- 3. Create Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  election_id INTEGER,
  name TEXT NOT NULL,
  FOREIGN KEY(election_id) REFERENCES elections(id) ON DELETE CASCADE
);

-- 4. Create Voter Participation Tracking Table (Enforces 1 vote per election per user)
CREATE TABLE IF NOT EXISTS participation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voter_email TEXT NOT NULL,
  election_id INTEGER NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(voter_email, election_id),
  FOREIGN KEY(voter_email) REFERENCES users(email) ON DELETE CASCADE,
  FOREIGN KEY(election_id) REFERENCES elections(id) ON DELETE CASCADE
);

-- 5. Create Anonymous Ballots Table (Ensures secure anonymous vote counts)
CREATE TABLE IF NOT EXISTS ballots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  election_id INTEGER NOT NULL,
  candidate_id INTEGER NOT NULL,
  FOREIGN KEY(election_id) REFERENCES elections(id) ON DELETE CASCADE,
  FOREIGN KEY(candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);
