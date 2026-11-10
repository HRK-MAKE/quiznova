import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import quizRoutes from './routes/quiz.routes.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials:true }));
  app.use(express.json({ limit:'1mb' }));
  app.use(rateLimit({ windowMs:15*60*1000, limit:300, standardHeaders:true, legacyHeaders:false }));
  app.get('/health', (_req,res) => res.json({ success:true, data:{ status:'ok', service:'quiznova-api' } }));
  app.use('/api/auth', authRoutes);
  app.use('/api/quizzes', quizRoutes);
  app.use((_req,res) => res.status(404).json({ success:false, error:'Route not found' }));
  app.use((err,_req,res,_next) => {
    console.error(err);
    res.status(500).json({ success:false, error:'Internal server error' });
  });
  return app;
}
