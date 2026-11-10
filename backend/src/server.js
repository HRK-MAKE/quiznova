import 'dotenv/config';
import http from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { checkMySQL } from './config/mysql.js';
import { connectMongoDB } from './config/mongodb.js';
import { registerSocketHandlers } from './sockets/index.js';

const required = ['JWT_SECRET','MYSQL_HOST','MYSQL_USER','MYSQL_DATABASE','MONGODB_URI'];
for (const key of required) if (!process.env[key]) throw new Error(`${key} is required in backend/.env`);

await checkMySQL();
console.log('MySQL connected');
await connectMongoDB();

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, { cors:{ origin:process.env.CLIENT_ORIGIN, credentials:true } });
registerSocketHandlers(io);

const port = Number(process.env.PORT || 4000);
server.listen(port, () => console.log(`QuizNova API listening on http://localhost:${port}`));
