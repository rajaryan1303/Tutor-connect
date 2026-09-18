import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'released', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    method: { type: String, default: 'card' },
    razorpay: {
      orderId: String,
      paymentId: String,
      signature: String,
    },
  },
  { timestamps: true }
)

paymentSchema.index({ studentId: 1, status: 1 })
paymentSchema.index({ teacherId: 1, status: 1 })

export default mongoose.model('Payment', paymentSchema)