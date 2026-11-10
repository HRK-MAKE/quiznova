# Implementation status

## Included in this ZIP
- Vanilla HTML/CSS/JavaScript login and teacher quiz-list starter UI
- Express server and health endpoint
- MySQL connection pool and SQL schema
- Teacher registration/login with bcrypt and JWT
- MongoDB/Mongoose quiz model and teacher-owned quiz CRUD foundation
- Socket.IO server with JWT handshake authentication foundation
- Environment template and local setup guide

## Still required before production
- Refresh-token rotation, secure cookie strategy, password reset and email verification
- Full question editor and question-type validation
- Guest student PIN join, collision checks, lobby and participant persistence
- Complete Socket.IO authorization, reconnect, timer and progression state machine
- Server-side answer validation, speed scoring, streaks and leaderboard
- Safe student question payloads that omit answer keys
- Classroom management, analytics, PDF/Excel exports
- Upload scanning/storage, audit logging, comprehensive tests, deployment configuration

Do not treat the TODO items as implemented features.
