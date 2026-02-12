const assert = require('assert');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const API_URL = 'http://localhost:4000';
const DB_PATH = path.resolve(__dirname, '../voting.db');

// Helper for fetch wrapper
async function api(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const error = new Error(data.error || res.statusText);
        error.response = { data, status: res.status };
        throw error;
    }
    return { data, status: res.status };
}

// Helper to open DB
function openDb() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) reject(err);
            else resolve(db);
        });
    });
}

// Helper to run SQL
function runSql(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

// Helper to get SQL
function getSql(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

async function testVoteFlow() {
    console.log('--- Starting Vote Flow Test ---');

    const timestamp = Date.now();
    const userEmail = `testuser_${timestamp}@example.com`;
    const userPass = 'password123';

    try {
        // Register User
        console.log('1. Registering user...');
        const regRes = await api(`${API_URL}/auth/register`, {
            method: 'POST',
            body: JSON.stringify({
                name: 'Test User',
                email: userEmail,
                password: userPass
            })
        });
        const token = regRes.data.token;
        console.log('   User registered. Token obtained.');

        // Promote user to admin via DB
        db = await openDb();
        await runSql(db, "UPDATE users SET role = 'admin' WHERE email = ?", [userEmail]);
        db.close(); // Close connection to avoid locking issues
        db = null; // Reset db to null after closing
        console.log('   User promoted to admin via DB.');

        // Login to get new token with admin role
        console.log('2. Logging in as admin...');
        const loginRes = await api(`${API_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
                email: userEmail,
                password: userPass
            })
        });
        const adminToken = loginRes.data.token;
        const authHeaders = { 'Authorization': `Bearer ${adminToken}` };

        // Create Election
        console.log('3. Creating election...');
        const elecRes = await api(`${API_URL}/elections/create`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                title: `Test Election ${timestamp}`,
                description: 'Test Description'
            })
        });
        const electionId = elecRes.data.id;
        console.log(`   Election created. ID: ${electionId}`);

        // Add Candidate
        console.log('4. Adding candidate...');
        const candRes = await api(`${API_URL}/candidates/add`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                election_id: electionId,
                name: 'Candidate A'
            })
        });
        const candidateId = candRes.data.id;
        console.log(`   Candidate added. ID: ${candidateId}`);

        // Vote
        console.log('5. Voting...');
        const voteRes = await api(`${API_URL}/vote`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                election_id: electionId,
                candidate_id: candidateId
            })
        });
        console.log(`   Vote response: ${voteRes.data.message}`);
        assert.ok(voteRes.data.message.includes('recorded'), 'Vote should be recorded');

        // Verify Anonymity in DB
        console.log('6. Verifying Anonymity...');
        const participation = await getSql(db, 'SELECT * FROM participation WHERE voter_email = ? AND election_id = ?', [userEmail, electionId]);
        assert.ok(participation, 'Participation record should exist');

        const ballot = await getSql(db, 'SELECT * FROM ballots WHERE election_id = ? AND candidate_id = ?', [electionId, candidateId]);
        assert.ok(ballot, 'Ballot should exist');
        assert.strictEqual(ballot.voter_email, undefined, 'Ballot should NOT have voter_email');

        // Verify Double Voting Prevention
        console.log('7. Verifying Double Voting Prevention...');
        try {
            await api(`${API_URL}/vote`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    election_id: electionId,
                    candidate_id: candidateId
                })
            });
            assert.fail('Should have thrown error for double voting');
        } catch (e) {
            assert.ok(e.response.data.error.includes('already voted'), 'Should return already voted error');
            console.log('   Double voting prevented successfully.');
        }

        // Verify Results
        console.log('8. Verifying Results...');
        const resultsRes = await api(`${API_URL}/results/${electionId}`, {
            headers: authHeaders
        });
        const result = resultsRes.data.results.find(r => r.candidate_name === 'Candidate A');
        assert.strictEqual(result.total_votes, 1, 'Candidate A should have 1 vote');
        console.log('   Results verified.');

        console.log('--- Test Passed ---');

    } catch (e) {
        console.error('Test Failed:', e.message);
        if (e.response) console.error('Response data:', e.response.data);
        process.exit(1);
    }
}

testVoteFlow();
