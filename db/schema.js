const sqlite3 = require('sqlite3').verbose();

function initializeDatabase(db) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Drop existing tables if in test environment
            if (process.env.NODE_ENV === 'test') {
                db.run('DROP TABLE IF EXISTS votes');
                db.run('DROP TABLE IF EXISTS candidates');
                db.run('DROP TABLE IF EXISTS elections');
                db.run('DROP TABLE IF EXISTS users');
            }

            // Create users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                role TEXT DEFAULT 'voter',
                password_hash TEXT,
                reset_token TEXT,
                reset_token_expires TEXT
            )`, (err) => {
                if (err) {
                    console.error('Error creating users table:', err);
                    return reject(err);
                }

                // Create elections table
                db.run(`CREATE TABLE IF NOT EXISTS elections (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    start_date TEXT,
                    end_date TEXT
                )`, (err) => {
                    if (err) {
                        console.error('Error creating elections table:', err);
                        return reject(err);
                    }

                    // Create candidates table
                    db.run(`CREATE TABLE IF NOT EXISTS candidates (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        election_id INTEGER,
                        name TEXT NOT NULL,
                        FOREIGN KEY(election_id) REFERENCES elections(id)
                    )`, (err) => {
                        if (err) {
                            console.error('Error creating candidates table:', err);
                            return reject(err);
                        }

                        // Create votes table
                        db.run(`CREATE TABLE IF NOT EXISTS votes (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            voter_email TEXT NOT NULL,
                            election_id INTEGER NOT NULL,
                            candidate_id INTEGER NOT NULL,
                            FOREIGN KEY(voter_email) REFERENCES users(email),
                            FOREIGN KEY(election_id) REFERENCES elections(id),
                            FOREIGN KEY(candidate_id) REFERENCES candidates(id)
                        )`, (err) => {
                            if (err) {
                                console.error('Error creating votes table:', err);
                                return reject(err);
                            }
                            resolve();
                        });
                    });
                });
            });
        });
    });
}

module.exports = { initializeDatabase };