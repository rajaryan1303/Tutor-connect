import User from '../models/User.js'
import Booking from '../models/Booking.js'
import Payment from '../models/Payment.js'
import TutorProfile from '../models/TutorProfile.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { serializeUser, toClient } from '../utils/serialize.js'
import { attachBookingNames } from '../utils/names.js'
import { isValidObjectId } from '../validators/index.js'

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: 1 }).lean()
  res.json({ users: users.map(serializeUser) })
})

export const listBookings = asyncHandler(async (req, res) => {
  const bookings = await attachBookingNames(
    await Booking.find().sort({ datetime: -1 }).lean()
  )
  res.json({ bookings: toClient(bookings) })
})

export const getTeacherDetail = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid user ID')
  const user = await User.findOne({ _id: id, role: 'teacher' })
  if (!user) throw new ApiError(404, 'Teacher not found')
  const profile = (await TutorProfile.findOne({ user: id }).lean()) || {}
  res.json({ user: serializeUser(user), profile: toClient(profile) })
})

export const approveTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid user ID')
  const user = await User.findOne({ _id: id, role: 'teacher' })
  if (!user) throw new ApiError(404, 'Teacher not found')
  user.approved = true
  await user.save()
  res.json({ user: serializeUser(user) })
})

export const analytics = asyncHandler(async (req, res) => {
  const [users, students, teachers, bookings, payments, activeStudents, activeTeachers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    Booking.countDocuments(),
    Payment.find().lean(),
    Booking.distinct('studentId'),
    Booking.distinct('teacherId'),
  ])
  res.json({
    totals: {
      users,
      students,
      teachers,
      bookings,
      revenue: payments.reduce((s, p) => s + Number(p.amount || 0), 0),
      activeStudents: activeStudents.length,
      activeTeachers: activeTeachers.length,
    },
  })
})

export const releasePayout = asyncHandler(async (req, res) => {
  const { bookingId } = req.body || {}
  if (!isValidObjectId(bookingId)) throw new ApiError(400, 'Invalid booking ID')
  const payment = await Payment.findOne({ bookingId })
  if (!payment) throw new ApiError(404, 'No payment found for this booking')
  if (payment.status !== 'paid') throw new ApiError(400, 'No paid amount to release')
  payment.status = 'released'
  await payment.save()

  await TutorProfile.updateOne({ user: payment.teacherId }, { $inc: { earnings: Number(payment.amount || 0) } })

  res.json({ payment: toClient(payment) })
})