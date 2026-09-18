import Payment from '../models/Payment.js'
import User from '../models/User.js'
import Booking from '../models/Booking.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { toClient } from '../utils/serialize.js'
import { attachPaymentDetails } from '../utils/names.js'
import { isValidObjectId } from '../validators/index.js'
import {
  findOrCreatePayment,
  markPaid,
  createOrder,
  verifySignature,
} from '../services/paymentService.js'

async function ownBookingOr404(bookingId, studentId) {
  if (!isValidObjectId(bookingId)) throw new ApiError(400, 'Invalid booking ID')
  const booking = await Booking.findById(bookingId)
  if (!booking) throw new ApiError(404, 'Booking not found')
  if (String(booking.studentId) !== String(studentId)) throw new ApiError(403, 'Forbidden')
  return booking
}

// POST /payments/pay — the existing Student Dashboard flow. The payment is
// created and confirmed entirely on the server (sandbox gateway).
export const pay = asyncHandler(async (req, res) => {
  const { bookingId, method = 'card' } = req.body || {}
  const booking = await ownBookingOr404(bookingId, req.user._id)

  const payment = await findOrCreatePayment(booking, { status: 'pending', method })
  if (payment.status === 'paid') throw new ApiError(409, 'Payment already completed for this booking')
  if (payment.status === 'released') throw new ApiError(409, 'Payment already settled for this booking')

  const confirmed = await markPaid(payment)
  res.json({ payment: toClient(confirmed) })
})

// POST /payments/create-order — real gateway order creation (Razorpay) or sandbox.
export const createOrderForBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.body || {}
  const booking = await ownBookingOr404(bookingId, req.user._id)
  const existing = await Payment.findOne({ bookingId: booking._id })
  if (existing && ['paid', 'released'].includes(existing.status)) {
    throw new ApiError(409, 'Payment already completed for this booking')
  }

  const { gateway, order } = await createOrder({
    amount: booking.price,
    receipt: `booking_${booking._id}`,
    notes: { bookingId: String(booking._id) },
  })

  res.json({ gateway, order, bookingId: String(booking._id), amount: booking.price })
})

// POST /payments/verify — server-side signature verification.
export const verifyPayment = asyncHandler(async (req, res) => {
  const { bookingId, paymentId, orderId, signature, method } = req.body || {}
  const booking = await ownBookingOr404(bookingId, req.user._id)

  verifySignature({ paymentId, orderId, signature })

  const payment = await findOrCreatePayment(booking, { status: 'pending', method: method || 'razorpay' })
  if (payment.status === 'paid') throw new ApiError(409, 'Payment already completed for this booking')
  if (payment.status === 'released') throw new ApiError(409, 'Payment already settled for this booking')

  const confirmed = await markPaid(payment, { orderId, paymentId, signature, method })
  res.json({ payment: toClient(confirmed) })
})

// GET /payments/me — student: own payments; teacher: payments on own bookings; admin: all.
export const listMyPayments = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.user.role === 'student') filter.studentId = req.user._id
  else if (req.user.role === 'teacher') filter.teacherId = req.user._id
  const payments = await attachPaymentDetails(
    await Payment.find(filter).sort({ createdAt: -1 }).lean()
  )
  res.json({ payments: toClient(payments) })
})