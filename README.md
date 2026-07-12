# Shop Management System

DBMS course project — web-based shop management system using HTML/CSS/JS, Node.js + Express, and MySQL with raw SQL.

## Phase 0 — Setup Instructions

Follow these steps on your own machine to get this scaffold running.

### 1. Install prerequisites
- **Node.js** (LTS version): https://nodejs.org — verify with `node -v` and `npm -v`
- **MySQL** (MySQL Server + MySQL Workbench, or just the server + CLI): https://dev.mysql.com/downloads/
- **Postman**: https://www.postman.com/downloads/
- **Git**: https://git-scm.com/downloads — verify with `git --version`

### 2. Get the project onto your machine
Unzip this project folder, then:
```bash
cd shop-management-system
git init
git add .
git commit -m "Initial project scaffold - Phase 0"
```
Create a new empty repo on GitHub, then:
```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

### 3. Install backend dependencies
```bash
cd backend
npm install
```
This reads `package.json` and installs express, mysql2, dotenv, bcrypt, jsonwebtoken, multer, and nodemon (dev).

### 4. Configure environment variables
```bash
cp .env.example .env
```
Open `.env` and set `DB_PASSWORD` to your actual MySQL root password (or a dedicated MySQL user you create), and set `JWT_SECRET` to any long random string.

### 5. Create the database (placeholder for now)
Log into MySQL and run:
```sql
CREATE DATABASE shop_management_db;
```
Full schema (`schema.sql`) comes in **Phase 1** — this just creates the empty database so the connection test in step 6 succeeds.

### 6. Run the backend
```bash
npm run dev
```
Expected output:
```
🚀 Server running on http://localhost:5000
✅ MySQL connected. Test query result: 2
```
Test it in the browser or Postman: `GET http://localhost:5000/api/health`

### 7. Open the frontend
Open `frontend/pages/index.html` in your browser (or use the VS Code "Live Server" extension). It should show a green "Shop Management System backend is running" message once the backend is up — confirming frontend and backend can talk to each other.

---

## Project Structure
```
shop-management-system/
├── backend/
│   ├── config/db.js       # MySQL connection pool
│   ├── routes/            # API route definitions (Phase 2+)
│   ├── controllers/       # Route handler logic (Phase 2+)
│   ├── middleware/        # Auth/role middleware (Phase 2+)
│   ├── sql/                # schema.sql, seed.sql (Phase 1)
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── pages/index.html
    ├── css/styles.css
    └── js/main.js
```

## Phase Checklist
- [x] Phase 0 — Setup & Planning
- [ ] Phase 1 — Database Design (ER diagram + schema.sql)
- [ ] Phase 2 — Backend Foundation & Authentication
- [ ] Phase 3 — Core Master Data Modules (CRUD)
- [ ] Phase 4 — Purchase Management (Transactions)
- [ ] Phase 5 — Sales Management (Transactions + Calculations)
- [ ] Phase 6 — Inventory & Reports
- [ ] Phase 7 — Frontend
- [ ] Phase 8 — Testing, Polish & Documentation
