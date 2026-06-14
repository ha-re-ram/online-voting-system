import bcrypt from 'bcryptjs';

// ----------------------------------------------------
// 🔑 W3C WEB CRYPTO API JWT HELPERS (ZERO-DEPENDENCY)
// ----------------------------------------------------

function base64urlEncode(str) {
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

async function getCryptoKey(secret) {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signJWT(payload, secret, expiresInHours = 8) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + (expiresInHours * 3600);
  const fullPayload = { ...payload, exp };
  
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  
  const key = await getCryptoKey(secret);
  const enc = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign));
  
  const signatureBytes = new Uint8Array(signature);
  let signatureString = '';
  for (let i = 0; i < signatureBytes.length; i++) {
    signatureString += String.fromCharCode(signatureBytes[i]);
  }
  const encodedSignature = base64urlEncode(signatureString);
  
  return `${dataToSign}.${encodedSignature}`;
}

async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token structure');
  
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToVerify = `${encodedHeader}.${encodedPayload}`;
  
  const key = await getCryptoKey(secret);
  const enc = new TextEncoder();
  
  const signatureString = base64urlDecode(encodedSignature);
  const signatureBytes = new Uint8Array(signatureString.length);
  for (let i = 0; i < signatureString.length; i++) {
    signatureBytes[i] = signatureString.charCodeAt(i);
  }
  
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    enc.encode(dataToVerify)
  );
  
  if (!isValid) throw new Error('Invalid signature');
  
  const payload = JSON.parse(base64urlDecode(encodedPayload));
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    throw new Error('Token expired');
  }
  
  return payload;
}

// ----------------------------------------------------
// 🌐 GLOBAL RESPONSE HELPER
// ----------------------------------------------------

function makeResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}

// ----------------------------------------------------
// 🚀 MAIN SERVERLESS CATCH-ALL ROUTER
// ----------------------------------------------------

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Handle preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  const JWT_SECRET = env.JWT_SECRET || 'change_this_secret';

  // Extract and verify Authorization header token
  let user = null;
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      user = await verifyJWT(token, JWT_SECRET);
    } catch (e) {
      // Continue unauthenticated, handlers will block if strictly required
    }
  }

  function requireAuth() {
    if (!user) {
      throw new Error('401:Authorization token required');
    }
  }

  function requireAdmin() {
    requireAuth();
    if (user.role !== 'admin') {
      throw new Error('403:Admin access required');
    }
  }

  try {
    // ----------------------------------------------------
    // AUTHENTICATION ENDPOINTS
    // ----------------------------------------------------

    if (path === '/api/auth/register' && method === 'POST') {
      const { name, email, password, role } = await request.json();
      if (!name || !email || !password) {
        return makeResponse({ error: 'name, email and password required' }, 400);
      }

      // Check if user already exists
      const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
      if (existing) {
        return makeResponse({ error: 'User already exists' }, 400);
      }

      const hash = bcrypt.hashSync(password, 8);
      const userRole = role || 'voter';
      
      const insertResult = await env.DB.prepare(
        'INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)'
      ).bind(name, email, userRole, hash).run();
      
      const userId = insertResult.meta.last_row_id;
      const userPayload = { id: userId, name, email, role: userRole };
      const token = await signJWT(userPayload, JWT_SECRET);

      return makeResponse({ message: 'registered', user: userPayload, token });
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = await request.json();
      if (!email || !password) {
        return makeResponse({ error: 'email and password required' }, 400);
      }

      const dbUser = await env.DB.prepare('SELECT id, name, email, role, password_hash FROM users WHERE email = ?').bind(email).first();
      if (!dbUser) {
        return makeResponse({ error: 'User not found' }, 404);
      }
      if (!dbUser.password_hash) {
        return makeResponse({ error: 'User has no password (legacy account)' }, 400);
      }

      const ok = bcrypt.compareSync(password, dbUser.password_hash);
      if (!ok) {
        return makeResponse({ error: 'Invalid credentials' }, 401);
      }

      const userPayload = { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role };
      const token = await signJWT(userPayload, JWT_SECRET);

      return makeResponse({ message: 'Login ok', user: userPayload, token });
    }

    if (path === '/api/auth/forgot-password' && method === 'POST') {
      const { email } = await request.json();
      if (!email) return makeResponse({ error: 'Email required' }, 400);

      const dbUser = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
      if (!dbUser) return makeResponse({ error: 'Email not found' }, 404);

      const resetToken = await signJWT({ email, purpose: 'reset' }, JWT_SECRET, 1);
      const expires = new Date(Date.now() + 3600000).toISOString();

      await env.DB.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?')
        .bind(resetToken, expires, email)
        .run();

      return makeResponse({ message: 'Password reset instructions sent' });
    }

    if (path === '/api/auth/reset-password' && method === 'POST') {
      const { resetToken, newPassword } = await request.json();
      if (!resetToken || !newPassword) {
        return makeResponse({ error: 'Reset token and new password required' }, 400);
      }

      try {
        const decoded = await verifyJWT(resetToken, JWT_SECRET);
        if (decoded.purpose !== 'reset') {
          return makeResponse({ error: 'Invalid reset token purpose' }, 400);
        }

        const dbUser = await env.DB.prepare('SELECT email, reset_token, reset_token_expires FROM users WHERE email = ?')
          .bind(decoded.email)
          .first();

        if (!dbUser || dbUser.reset_token !== resetToken) {
          return makeResponse({ error: 'Invalid reset token' }, 400);
        }

        if (dbUser.reset_token_expires && new Date(dbUser.reset_token_expires) < new Date()) {
          return makeResponse({ error: 'Reset token has expired' }, 400);
        }

        const hash = bcrypt.hashSync(newPassword, 8);
        await env.DB.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?')
          .bind(hash, decoded.email)
          .run();

        return makeResponse({ message: 'Password reset successful' });
      } catch (e) {
        return makeResponse({ error: 'Invalid or expired reset token' }, 400);
      }
    }

    // ----------------------------------------------------
    // VOTER ENDPOINTS
    // ----------------------------------------------------

    if (path === '/api/my-votes' && method === 'GET') {
      requireAuth();
      const { results } = await env.DB.prepare('SELECT election_id FROM participation WHERE voter_email = ?')
        .bind(user.email)
        .all();
      return makeResponse(results.map(row => row.election_id));
    }

    if (path === '/api/elections' && method === 'GET') {
      if (user) {
        // Authenticated users get all elections
        const { results } = await env.DB.prepare('SELECT id, title, description, start_date, end_date FROM elections').all();
        return makeResponse(results);
      } else {
        // Unauthenticated users only see ended elections
        const now = new Date().toISOString();
        const { results } = await env.DB.prepare('SELECT id, title, description, start_date, end_date FROM elections WHERE end_date IS NOT NULL AND end_date < ?')
          .bind(now)
          .all();
        return makeResponse(results);
      }
    }

    if (path.startsWith('/api/candidates/') && method === 'GET') {
      const electionId = path.split('/')[3];
      
      const election = await env.DB.prepare('SELECT end_date FROM elections WHERE id = ?').bind(electionId).first();
      if (!election) return makeResponse({ error: 'Election not found' }, 404);

      const now = new Date().toISOString();
      const hasEnded = election.end_date && new Date(election.end_date) < new Date();

      if (!user && !hasEnded) {
        return makeResponse({ error: 'Authentication required to view active election candidates' }, 401);
      }

      const { results } = await env.DB.prepare('SELECT id, election_id, name FROM candidates WHERE election_id = ?')
        .bind(electionId)
        .all();
      return makeResponse(results);
    }

    if (path === '/api/vote' && method === 'POST') {
      requireAuth();
      const { election_id, candidate_id } = await request.json();
      if (!election_id || !candidate_id) {
        return makeResponse({ error: 'Election ID and Candidate ID required' }, 400);
      }

      // Check double-vote
      const existing = await env.DB.prepare('SELECT id FROM participation WHERE voter_email = ? AND election_id = ?')
        .bind(user.email, election_id)
        .first();
      if (existing) {
        return makeResponse({ error: 'You have already voted in this election' }, 400);
      }

      // Cast using batch
      const stmt1 = env.DB.prepare('INSERT INTO participation (voter_email, election_id) VALUES (?, ?)').bind(user.email, election_id);
      const stmt2 = env.DB.prepare('INSERT INTO ballots (election_id, candidate_id) VALUES (?, ?)').bind(election_id, candidate_id);
      
      const batchResult = await env.DB.batch([stmt1, stmt2]);
      const vote_id = batchResult[1].meta.last_row_id;

      return makeResponse({ message: 'Your vote was recorded securely', vote_id });
    }

    if (path === '/api/all-votes' && method === 'GET') {
      requireAuth();
      const { results } = await env.DB.prepare('SELECT id, election_id, candidate_id FROM ballots').all();
      return makeResponse(results);
    }

    if (path.startsWith('/api/results/') && method === 'GET') {
      const electionId = path.split('/')[3];

      const election = await env.DB.prepare('SELECT end_date FROM elections WHERE id = ?').bind(electionId).first();
      if (!election) return makeResponse({ error: 'Election not found' }, 404);

      const now = new Date().toISOString();
      const hasEnded = election.end_date && new Date(election.end_date) < new Date();

      if (!user && !hasEnded) {
        return makeResponse({ error: 'Authentication required to view active election results' }, 401);
      }

      const sql = `
        SELECT
          c.name AS candidate_name,
          COUNT(b.id) AS total_votes
        FROM candidates c
        LEFT JOIN ballots b ON c.id = b.candidate_id
        WHERE c.election_id = ?
        GROUP BY c.id, c.name
        ORDER BY total_votes DESC
      `;
      const { results } = await env.DB.prepare(sql).bind(electionId).all();
      return makeResponse({ election_id: electionId, results });
    }

    // ----------------------------------------------------
    // ADMIN ENDPOINTS
    // ----------------------------------------------------

    if (path === '/api/users' && method === 'GET') {
      requireAdmin();
      const { results } = await env.DB.prepare('SELECT id, name, email, role FROM users').all();
      return makeResponse(results);
    }

    if (path === '/api/elections/create' && method === 'POST') {
      requireAdmin();
      const { title, description, start_date, end_date, candidates } = await request.json();
      if (!title) return makeResponse({ error: 'Title is required' }, 400);

      const electionResult = await env.DB.prepare(
        'INSERT INTO elections (title, description, start_date, end_date) VALUES (?, ?, ?, ?)'
      ).bind(title, description || '', start_date || null, end_date || null).run();
      
      const electionId = electionResult.meta.last_row_id;

      if (Array.isArray(candidates) && candidates.length > 0) {
        const statements = candidates
          .filter(name => name && name.trim())
          .map(name => env.DB.prepare('INSERT INTO candidates (election_id, name) VALUES (?, ?)').bind(electionId, name.trim()));
        
        if (statements.length > 0) {
          await env.DB.batch(statements);
        }
      }

      return makeResponse({ message: 'Election created successfully with candidates', id: electionId });
    }

    if (path === '/api/candidates/add' && method === 'POST') {
      requireAdmin();
      const { election_id, name } = await request.json();
      if (!election_id || !name) return makeResponse({ error: 'Election ID and candidate name required' }, 400);
      
      const result = await env.DB.prepare('INSERT INTO candidates (election_id, name) VALUES (?, ?)').bind(election_id, name).run();
      return makeResponse({ message: 'Candidate added', id: result.meta.last_row_id });
    }

    if (path.startsWith('/api/election/') && method === 'DELETE') {
      requireAdmin();
      const electionId = path.split('/')[3];

      const stmt1 = env.DB.prepare('DELETE FROM participation WHERE election_id = ?').bind(electionId);
      const stmt2 = env.DB.prepare('DELETE FROM ballots WHERE election_id = ?').bind(electionId);
      const stmt3 = env.DB.prepare('DELETE FROM candidates WHERE election_id = ?').bind(electionId);
      const stmt4 = env.DB.prepare('DELETE FROM elections WHERE id = ?').bind(electionId);

      await env.DB.batch([stmt1, stmt2, stmt3, stmt4]);
      return makeResponse({ message: 'Election deleted' });
    }

    if (path.startsWith('/api/candidate/') && method === 'DELETE') {
      requireAdmin();
      const candidateId = path.split('/')[3];

      const stmt1 = env.DB.prepare('DELETE FROM ballots WHERE candidate_id = ?').bind(candidateId);
      const stmt2 = env.DB.prepare('DELETE FROM candidates WHERE id = ?').bind(candidateId);

      await env.DB.batch([stmt1, stmt2]);
      return makeResponse({ message: 'Candidate deleted' });
    }

    if (path.startsWith('/api/user/') && method === 'DELETE') {
      requireAdmin();
      const userId = path.split('/')[3];

      const dbUser = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first();
      if (!dbUser) return makeResponse({ error: 'User not found' }, 404);

      const stmt1 = env.DB.prepare('DELETE FROM participation WHERE voter_email = ?').bind(dbUser.email);
      const stmt2 = env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId);

      await env.DB.batch([stmt1, stmt2]);
      return makeResponse({ message: 'User deleted' });
    }

    if (path === '/api/make-admin' && method === 'POST') {
      requireAdmin();
      const { id } = await request.json();
      if (!id) return makeResponse({ error: 'User ID required' }, 400);

      const result = await env.DB.prepare("UPDATE users SET role = 'admin' WHERE id = ?").bind(id).run();
      if (result.meta.changes === 0) return makeResponse({ error: 'User not found' }, 404);

      return makeResponse({ message: 'User promoted to admin' });
    }

    if (path === '/api/make-voter' && method === 'POST') {
      requireAdmin();
      const { id } = await request.json();
      if (!id) return makeResponse({ error: 'User ID required' }, 400);

      const result = await env.DB.prepare("UPDATE users SET role = 'voter' WHERE id = ?").bind(id).run();
      if (result.meta.changes === 0) return makeResponse({ error: 'User not found' }, 404);

      return makeResponse({ message: 'User demoted to voter' });
    }

    return makeResponse({ error: 'Endpoint not found' }, 404);

  } catch (err) {
    const errMsg = err.message || '';
    if (errMsg.startsWith('401:')) {
      return makeResponse({ error: errMsg.substring(4) }, 401);
    }
    if (errMsg.startsWith('403:')) {
      return makeResponse({ error: errMsg.substring(4) }, 403);
    }
    return makeResponse({ error: 'Server error: ' + err.message }, 500);
  }
}
