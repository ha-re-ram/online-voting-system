# 🗳️ Secure Online Voting System

A premium, secure, and production-ready Online Voting System built with **React, Vite, Node.js, Express, and SQLite**. The system is designed to provide high integrity, anonymity, and seamless user interaction, featuring JWT-based authentication, real-time results visualization, strict route protection, and bulletproof double-voting prevention.

Developed and maintained by **[Hare Ram Kushwaha](https://hareramkushwaha.com.np)**.

[![Website](https://img.shields.com/badge/Website-hareramkushwaha.com.np-blue?style=for-the-badge&logo=google-chrome&logoColor=white)](https://hareramkushwaha.com.np)
[![GitHub](https://img.shields.com/badge/GitHub-ha--re--ram-black?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ha-re-ram)
[![LinkedIn](https://img.shields.com/badge/LinkedIn-ha--re--ram-blue?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/ha-re-ram)
[![Email](https://img.shields.com/badge/Email-hareramkushwaha054%40gmail.com-red?style=for-the-badge&logo=gmail&logoColor=white)](mailto:hareramkushwaha054@gmail.com)
[![License](https://img.shields.com/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 🌟 Key Features

### 🔑 Secure Authentication & Session Management
- Fully integrated JWT token-based authentication (`/auth/register`, `/auth/login`).
- Secure password hashing using `bcryptjs`.
- State-preserving session persistence on the frontend.
- Secure, custom-designed input validation.

### 🗳️ Double-Voting Prevention & Anonymous Ballots
- Separate **Participation** (to record *who* voted) and **Ballots** (to record *how* they voted) tables.
- Cryptographically robust transaction-based backend that enforces exactly one vote per user per election.
- Real-time frontend validation: elections already voted in are locked automatically, rendering an informative status badge and guiding the voter to view results.
- End-to-end anonymity: individual ballot selections cannot be mapped back to voters once cast.

### 📊 Real-Time Results & Ended Elections Public Access
- Dynamic progress bars and percentage calculation showing real-time vote distribution.
- Leaderboard positioning that ranks candidates dynamically as votes arrive.
- **Ended Election Access Control:** 
  - Authenticated users can view live results of active elections.
  - Anyone (even unauthenticated guest users) can access and view results for completed elections after they end. Active election results remain hidden from unauthenticated guests.

### 🛠️ Premium Administrative Control Panel
- Exclusive role-based access control protecting all administrative routes and API endpoints.
- Single-interface Election Builder permitting admins to set an election's title, description, start date, end date, and dynamically construct a candidate list in one transaction.
- Candidate roster builder to add or delete candidates dynamically.
- Global user management dashboard to review registered users, promote users to Admin, demote to Voter, or delete accounts securely.

### 🌐 Concurrency & Production Readiness
- SQLite **WAL (Write-Ahead Logging) Mode** enabled for excellent write concurrency.
- Production-ready dynamic **CORS (Cross-Origin Resource Sharing)** configuration with env-fallback checks.
- Build-configured React static asset distribution with client-side route fallback.

---

## 🛠️ Technology Stack

### Frontend Client
- **React (v18)** — Modern component lifecycle and hooks structure.
- **Vite (v7)** — Extremely fast dev bundling and production tree-shaking.
- **React Router DOM (v6)** — Declarative routing with customized RequireAuth and RequireAdmin guards.
- **Axios** — Client interceptors automatically attaching JWT Bearer tokens to all requests.
- **Vanilla CSS** — Custom responsive design implementing harmonious color systems, HSL tailored variables, and glassmorphic micro-interactions.

### Backend Server
- **Node.js + Express** — High-performance RESTful API endpoints.
- **SQLite 3** — Lightweight, ultra-reliable local SQL database engine.
- **jsonwebtoken (JWT)** — Stateless payload signing for authorization.
- **bcryptjs** — Strong cryptographic salt and hashing for voter credentials.
- **cors** — Granular CORS policies for multi-origin production deployments.

---

## 🚀 How to Run Locally

### 1. Prerequisites
Ensure you have [Node.js (v16+)](https://nodejs.org/) installed on your machine.

### 2. Install Dependencies
Clone the repository and install packages in both the server root and the React client folder:

```bash
# Install server backend dependencies
npm install

# Install client frontend dependencies
npm install --prefix client
```

### 3. Start the Application
You can run both the API backend and Vite client concurrently using a single command:

```bash
# Start both Backend (Port 4000) and Frontend Client (Port 5173)
npm run dev:all
```

Alternatively, you can run them in separate terminal instances:

* **Terminal 1 (Backend API):**
  ```bash
  npm run dev
  ```
* **Terminal 2 (React Client):**
  ```bash
  npm run client
  ```

Once started, open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 🛡️ Production Deployment & Build

To compile a highly optimized static bundle of the client assets that Express can serve directly:

```bash
# Build the production bundle
npm run build
```

This generates tree-shaken, minified files inside `client/dist`. 
To launch the production server:

```bash
npm start
```
The application will run on [http://localhost:4000](http://localhost:4000) serving the client application directly.

---

## ⚙️ Configuration Variables

The backend respects the following environment variables if defined:

- `PORT` (Default: `4000`): The network port the server listens on.
- `JWT_SECRET` (Default: `change_this_secret`): The secret key used to sign JSON Web Tokens. Always change this in production!
- `ALLOWED_ORIGINS`: Comma-separated list of origins allowed by the CORS policy in production (e.g. `https://vote.hareramkushwaha.com.np`).

---

## 👨‍💻 Author & Credits

Designed, developed, and maintained with ❤️ by **[Hare Ram Kushwaha](https://hareramkushwaha.com.np)**.

Feel free to connect or reach out for inquiries, collaboration, or feedback:

* **Portfolio Website:** [hareramkushwaha.com.np](https://hareramkushwaha.com.np)
* **GitHub Profile:** [@ha-re-ram](https://github.com/ha-re-ram)
* **LinkedIn:** [Hare Ram Kushwaha on LinkedIn](https://linkedin.com/in/ha-re-ram)
* **Email Address:** [hareramkushwaha054@gmail.com](mailto:hareramkushwaha054@gmail.com)

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
