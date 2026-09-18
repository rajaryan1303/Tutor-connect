import User from '../models/User.js'
import Booking from '../models/Booking.js'

// Enriches bookings with student/teacher display names for dashboards.
export async function attachBookingNames(bookings = []) {
  if (!bookings.length) return bookings
  const ids = [...new Set(bookings.flatMap(b => [b.studentId, b.teacherId]).filter(Boolean))]
  const users = await User.find({ _id: { $in: ids } }).select('name role email').lean()
  const map = new Map(users.map(u => [String(u._id), u]))
  return bookings.map(b => ({
    ...b,
    studentName: map.get(String(b.studentId))?.name || 'Unknown student',
    teacherName: map.get(String(b.teacherId))?.name || 'Unknown teacher',
  }))
}

// Enriches reviews with the reviewer's display name.
export async function attachStudentNames(reviews = []) {
  if (!reviews.length) return reviews
  const ids = [...new Set(reviews.map(r => r.studentId).filter(Boolean))]
  const users = await User.find({ _id: { $in: ids } }).select('name').lean()
  const map = new Map(users.map(u => [String(u._id), u.name]))
  return reviews.map(r => ({ ...r, studentName: map.get(String(r.studentId)) || 'Unknown student' }))
}

// Enriches payments with booking subject + entity names.
export async function attachPaymentDetails(payments = []) {
  if (!payments.length) return payments
  const bIds = [...new Set(payments.map(p => p.bookingId).filter(Boolean))]
  const bookings = await attachBookingNames(await Booking.find({ _id: { $in: bIds } }).lean())
  const map = new Map(bookings.map(b => [String(b._id), b]))
  return payments.map(p => {
    const b = map.get(String(p.bookingId))
    return { ...p, subject: b?.subject, studentName: b?.studentName, teacherName: b?.teacherName }
  })
}