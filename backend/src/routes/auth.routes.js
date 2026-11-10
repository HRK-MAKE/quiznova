import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/mysql.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { fullName, email, password, role = 'TEACHER' } = req.body || {};
    if (!fullName?.trim() || !email?.trim() || typeof password !== 'string' || password.length < 8)
      return res.status(400).json({ success:false, error:'Name, valid email and password (8+ characters) are required' });
    if (!['TEACHER','STUDENT'].includes(role)) return res.status(400).json({ success:false, error:'Invalid role' });
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (full_name,email,password_hash,role) VALUES (?,?,?,?)',
      [fullName.trim(), email.trim().toLowerCase(), passwordHash, role]
    );
    return res.status(201).json({ success:true, data:{ user:{ id:String(result.insertId), fullName:fullName.trim(), email:email.trim().toLowerCase(), role } } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success:false, error:'Email is already registered' });
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const [rows] = await pool.execute(
      'SELECT id, full_name, email, password_hash, role, avatar FROM users WHERE email = ? LIMIT 1',
      [String(email || '').trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(String(password || ''), user.password_hash)))
      return res.status(401).json({ success:false, error:'Invalid email or password' });
    const token = jwt.sign(
      { userId:String(user.id), role:user.role, email:user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30m' }
    );
    return res.json({ success:true, data:{ token, user:{ id:String(user.id), fullName:user.full_name, email:user.email, role:user.role, avatar:user.avatar } } });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, full_name, email, role, avatar FROM users WHERE id = ? LIMIT 1',
      [req.user.userId]
    );
    if (!rows[0]) return res.status(404).json({ success:false, error:'User not found' });
    const u = rows[0];
    res.json({ success:true, data:{ user:{ id:String(u.id), fullName:u.full_name, email:u.email, role:u.role, avatar:u.avatar } } });
  } catch (error) { next(error); }
});

export default router;
