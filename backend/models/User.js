import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['student', 'teacher', 'admin'], required: true, index: true, default: 'student' },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    passwordHash: { type: String, required: true, select: false },
    approved: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)