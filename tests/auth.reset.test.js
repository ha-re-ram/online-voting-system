const request = require('supertest');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

describe('Password Reset Flow', () => {
    const testUser = {
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User',
        role: 'voter'
    };

    let app;
    let resetToken;

    beforeAll(async () => {
        // Set test environment
        process.env.NODE_ENV = 'test';
        
        // Import app before setting up database
        app = require('../server');
        
        // Set up test database
        const db = new sqlite3.Database(':memory:', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
        
        // Attach database to app
        app.db = db;

        // Create test schema
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run(`CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    role TEXT DEFAULT 'voter',
                    password_hash TEXT,
                    reset_token TEXT,
                    reset_token_expires TEXT
                )`, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });

        // Insert test user
        const hash = await bcrypt.hash(testUser.password, 10);
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)',
                [testUser.name, testUser.email, testUser.role, hash],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Verify user was created
        await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [testUser.email], (err, user) => {
                if (err) reject(err);
                if (!user) reject(new Error('Test user not created'));
                resolve();
            });
        });
    });

    afterAll(async () => {
        await new Promise((resolve) => app.db.close(resolve));
    });

    test('should get reset token when requesting password reset', async () => {
        const response = await request(app)
            .post('/auth/forgot-password')
            .send({ email: testUser.email });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('resetToken');
        resetToken = response.body.resetToken;

        // Verify the token was stored in the database
        await new Promise((resolve, reject) => {
            app.db.get(
                'SELECT reset_token FROM users WHERE email = ?',
                [testUser.email],
                (err, row) => {
                    if (err) reject(err);
                    expect(row.reset_token).toBe(resetToken);
                    resolve();
                }
            );
        });
    });

    test('should reset password with valid token', async () => {
        // Wait a bit to ensure token is stored
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify the token is in the database
        await new Promise((resolve, reject) => {
            app.db.get(
                'SELECT reset_token FROM users WHERE email = ?',
                [testUser.email],
                (err, row) => {
                    if (err) reject(err);
                    console.log('DB token:', row?.reset_token);
                    console.log('Test token:', resetToken);
                    resolve();
                }
            );
        });

        const newPassword = 'newpassword123';
        console.log('Sending reset request with:', { token: resetToken, newPassword });
        const response = await request(app)
            .post('/auth/reset-password')
            .send({
                token: resetToken,
                newPassword
            });

        if (response.status !== 200) {
            console.error('Reset password response:', response.body);
        }

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Password reset successful');

        // Verify the password was updated
        await new Promise((resolve, reject) => {
            app.db.get(
                'SELECT password_hash FROM users WHERE email = ?',
                [testUser.email],
                (err, row) => {
                    if (err) reject(err);
                    expect(bcrypt.compareSync(newPassword, row.password_hash)).toBe(true);
                    resolve();
                }
            );
        });
    });

    test('should be able to login with new password', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: testUser.email,
                password: 'newpassword123'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
    });

    test('should not reset password with invalid token', async () => {
        const response = await request(app)
            .post('/auth/reset-password')
            .send({
                resetToken: 'invalid-token',
                newPassword: 'somepassword'
            });

        expect(response.status).toBe(400);
    });
});