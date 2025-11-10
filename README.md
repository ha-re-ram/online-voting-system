# Online Voting System (Updated)

This repo now includes:
- Updated backend with JWT auth endpoints (`/auth/register`, `/auth/login`) and optional token-based protection for admin routes.
- A client SPA scaffold (React + Vite) under `client/` implementing login and dashboard pages.

Quick start (local):

1. Install server deps in project root:

```powershell
npm install
```

2. Install client deps and start client (in a new shell):

```powershell
cd client
npm install
npm run dev
```

3. Start server (from project root):

```powershell
node server.js
```

4. Open the client SPA (Vite will show the URL, usually http://localhost:5173). Or use the existing static pages at http://localhost:4000/ (login will be served by server root).

Notes:
- For production you should set `JWT_SECRET` environment variable.
- I added `password_hash` column to `users` for password-based accounts. Existing legacy users without a password will still work with the legacy `/login` endpoint but cannot use `/auth/login` until they set a password (register again).

Next steps I can take:
- Wire the SPA to the new API routes fully (vote/create election flows inside the SPA).
- Add a build script and CORS config for production.
- Add remaining pages (Vote, Results, Admin) as SPA routes and protect admin routes.
- Add unit/integration tests.

Tell me which next step to take and I will continue.
