import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  isCorrect: { type: Boolean, default: false }
}, { _id: true });

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['MCQ', 'TRUE_FALSE', 'FILL_BLANK'], default: 'MCQ' },
  text: { type: String, required: true, trim: true },
  options: { type: [optionSchema], default: [] },
  acceptedAnswers: { type: [String], default: [] },
  timeLimit: { type: Number, min: 5, max: 300, default: 20 },
  points: { type: Number, min: 0, max: 10000, default: 1000 },
  explanation: { type: String, default: '' },
  orderIndex: { type: Number, required: true }
}, { _id: true });

const quizSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: '' },
  subject: { type: String, default: '' },
  topic: { type: String, default: '' },
  difficulty: { type: String, enum: ['EASY','MEDIUM','HARD'], default: 'MEDIUM' },
  status: { type: String, enum: ['DRAFT','PUBLISHED'], default: 'DRAFT', index: true },
  questions: { type: [questionSchema], default: [] }
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
