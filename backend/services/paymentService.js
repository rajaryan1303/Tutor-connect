import crypto from 'crypto'
import Razorpay from 'razorpay'
import Payment from '../models/Payment.js'
import { ApiError } from '../utils/ApiError.js'

const configured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)

function client() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

// Creates a Razorpay order when configured; otherwise a sandbox order.
export async function createOrder({ amount, receipt, notes }) {
  const rupees = Math.round(Number(amount)) // amount in whole units
  if (configured()) {
    const order = await client().orders.create({
      amount: rupees * 100,
      currency: 'INR',
      receipt: receipt || undefined,
      notes: notes || {},
    })
    return { gateway: 'razorpay', order }
  }
  return {
    gateway: 'sandbox',
    order: {
      id: `order_sandbox_${Date.now()}`,
      amount: rupees * 100,
      currency: 'INR',
      receipt: receipt || undefined,
    },
  }
}

// Server-side verification. Never trusts the frontend.
export function verifySignature({ paymentId, orderId, signature }) {
  if (!paymentId || !orderId || !signature) throw new ApiError(400, 'paymentId, orderId and signature are required')
  if (configured()) {
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')
    if (expected !== signature) throw new ApiError(400, 'Invalid payment signature')
    return true
  }
  // Sandbox: accept only sandbox orders we created.
  if (!String(orderId).startsWith('order_sandbox_')) throw new ApiError(400, 'Invalid payment signature')
  return true
}

// Ensures only one payment record exists per booking (returns existing one if present).
export async function findOrCreatePayment(booking, { status = 'pending', method = 'card' } = {}) {
  let payment = await Payment.findOne({ bookingId: booking._id })
  if (!payment) {
    payment = await Payment.create({
      bookingId: booking._id,
      studentId: booking.studentId,
      teacherId: booking.teacherId,
      amount: booking.price,
      status,
      method,
    })
  }
  return payment
}

export async function markPaid(payment, razorpayInfo) {
  payment.status = 'paid'
  if (razorpayInfo) {
    payment.razorpay = {
      orderId: razorpayInfo.orderId,
      paymentId: razorpayInfo.paymentId,
      signature: razorpayInfo.signature,
    }
    if (razorpayInfo.method) payment.method = razorpayInfo.method
  }
  await payment.save()
  return payment
}