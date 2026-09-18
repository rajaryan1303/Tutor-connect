import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true },
    mode: { type: String, enum: ['online', 'offline', 'both'], default: 'online' },
    datetime: { type: Date, required: true },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
)

// Prevent a tutor from being double-booked during an active (pending/accepted) slot.
bookingSchema.index(
  { teacherId: 1, datetime: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'accepted'] } } }
)

bookingSchema.index({ studentId: 1, status: 1 })
bookingSchema.index({ teacherId: 1, status: 1 })
bookingSchema.index({ datetime: 1 })

export default mongoose.model('Booking', bookingSchema)