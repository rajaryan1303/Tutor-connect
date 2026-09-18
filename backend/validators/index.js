import { ApiError } from '../utils/ApiError.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegister(body) {
  const { role, name, email, phone, password } = body
  if (!['student', 'teacher'].includes(role)) throw new ApiError(400, 'Invalid role')
  if (!name || !String(name).trim()) throw new ApiError(400, 'Name is required')
  if (!email || !EMAIL_RE.test(String(email))) throw new ApiError(400, 'Valid email is required')
  if (!password || String(password).length < 6) throw new ApiError(400, 'Password must be at least 6 characters')
  return { role, name: String(name).trim(), email: String(email).trim().toLowerCase(), phone: String(phone || '').trim(), password }
}

export function validateLogin(body) {
  const { email, password } = body
  if (!email || !password) throw new ApiError(400, 'Email and password are required')
  return { email: String(email).trim().toLowerCase(), password }
}

export function validateBooking(body) {
  const { teacherId, subject, mode, datetime, price } = body
  if (!teacherId) throw new ApiError(400, 'teacherId is required')
  if (!subject || !String(subject).trim()) throw new ApiError(400, 'subject is required')
  if (!['online', 'offline', 'both'].includes(mode)) throw new ApiError(400, 'Invalid mode')
  if (!datetime || Number.isNaN(new Date(datetime).getTime())) throw new ApiError(400, 'Valid datetime is required')
  if (price == null || Number(price) < 0) throw new ApiError(400, 'Valid price is required')
  return { teacherId, subject: String(subject).trim(), mode, datetime: new Date(datetime), price: Number(price) }
}

export function validateReview(body) {
  const { bookingId, rating, comment } = body
  if (!bookingId) throw new ApiError(400, 'bookingId is required')
  const r = Number(rating)
  if (!Number.isInteger(r) || r < 1 || r > 5) throw new ApiError(400, 'Rating must be an integer between 1 and 5')
  return { bookingId, rating: r, comment: String(comment || '').trim() }
}

export function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(String(id))
}