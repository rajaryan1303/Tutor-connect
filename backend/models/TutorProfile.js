import mongoose from 'mongoose'

const tutorProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    subjects: { type: [String], default: [] },
    experience: { type: Number, default: 0, min: 0 },
    timings: { type: [String], default: [] },
    rate: { type: Number, default: 0, min: 0 },
    mode: { type: String, enum: ['online', 'offline', 'both'], default: 'online' },
    areas: { type: [String], default: [] },
    bio: { type: String, default: '' },
    qualifications: { type: String, default: '' },
    ratings: {
      avg: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    completed: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
  },
  { timestamps: true }
)

tutorProfileSchema.index({ subjects: 1 })
tutorProfileSchema.index({ rate: 1 })
tutorProfileSchema.index({ mode: 1 })

export default mongoose.model('TutorProfile', tutorProfileSchema)