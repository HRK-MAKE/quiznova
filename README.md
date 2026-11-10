# QuizNova — HTML/CSS/JavaScript + Node/Express + MySQL + MongoDB

This is a **starter implementation scaffold**, not a completed production platform. It provides a runnable foundation for teacher registration/login, JWT-protected APIs, MongoDB quiz storage, and a Socket.IO connection. The complete multiplayer game workflow, refresh-token rotation, classrooms, reports, exports, and automated tests still need implementation.

## Stack
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js (ES modules), Express
- Authentication/relational data: MySQL (`mysql2`)
- Quiz documents: MongoDB (`mongoose`)
- Realtime foundation: Socket.IO
- Password hashing: `bcryptjs`

## Requirements
- Node.js 20+
- MySQL 8+
- MongoDB 6+

## Setup (Windows PowerShell)
1. Create a MySQL database:
   ```sql
   CREATE DATABASE quiznova_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Run `backend/database/mysql.sql` in MySQL Workbench or the MySQL CLI.
3. Start MongoDB locally, or use a MongoDB Atlas connection string.
4. Copy `backend/.env.example` to `backend/.env` and update credentials/secrets.
5. Install dependencies:
   ```powershell
   cd backend
   npm install
   ```
6. Start the API:
   ```powershell
   npm run dev
   ```
7. Open `frontend/index.html` through a local static server (for example VS Code Live Server) at the origin configured in `CLIENT_ORIGIN`.

API health check: `http://localhost:4000/health`

## Included functionality
- Teacher registration and login
- bcrypt password hashing
- JWT bearer authentication
- MySQL user persistence
- MongoDB quiz model and authenticated quiz create/list/read/update/delete routes
- Socket.IO server foundation with authenticated teacher socket connections
- Simple frontend login/register and quiz creation/listing UI

## Not yet complete
- Refresh-token rotation and password reset
- Student guest PIN join flow and unique PIN collision handling
- Complete lobby, synchronized question progression, answer validation, server-side scoring, reconnect protocol, and leaderboard
- Classroom/student management
- Analytics, PDF/Excel export
- File upload pipeline
- Full automated test suite and deployment hardening

Do not expose MongoDB quiz answer keys through public endpoints. Add a separate safe game-question serializer before implementing student gameplay.
