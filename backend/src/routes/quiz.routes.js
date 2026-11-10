import { Router } from 'express';
import Quiz from '../models/Quiz.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('TEACHER'));

router.get('/', async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ ownerId:req.user.userId }).select('-questions.options.isCorrect').sort({ updatedAt:-1 }).lean();
    res.json({ success:true, data:{ quizzes } });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, subject, topic, difficulty } = req.body || {};
    if (!title?.trim()) return res.status(400).json({ success:false, error:'Quiz title is required' });
    const quiz = await Quiz.create({ ownerId:req.user.userId, title:title.trim(), description, subject, topic, difficulty });
    res.status(201).json({ success:true, data:{ quiz } });
  } catch (e) { next(e); }
});

router.get('/:quizId', async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id:req.params.quizId, ownerId:req.user.userId }).lean();
    if (!quiz) return res.status(404).json({ success:false, error:'Quiz not found' });
    res.json({ success:true, data:{ quiz } });
  } catch (e) { next(e); }
});

router.put('/:quizId', async (req, res, next) => {
  try {
    const allowed = ['title','description','subject','topic','difficulty','status','questions'];
    const update = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
    const quiz = await Quiz.findOneAndUpdate(
      { _id:req.params.quizId, ownerId:req.user.userId },
      { $set:update }, { new:true, runValidators:true }
    );
    if (!quiz) return res.status(404).json({ success:false, error:'Quiz not found' });
    res.json({ success:true, data:{ quiz } });
  } catch (e) { next(e); }
});

router.delete('/:quizId', async (req, res, next) => {
  try {
    const deleted = await Quiz.findOneAndDelete({ _id:req.params.quizId, ownerId:req.user.userId });
    if (!deleted) return res.status(404).json({ success:false, error:'Quiz not found' });
    res.json({ success:true, data:{ message:'Quiz deleted' } });
  } catch (e) { next(e); }
});

export default router;
