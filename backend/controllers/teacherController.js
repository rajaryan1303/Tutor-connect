import TutorProfile from '../models/TutorProfile.js'
import Booking from '../models/Booking.js'
import Payment from '../models/Payment.js'
import Review from '../models/Review.js'
import User from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { toClient } from '../utils/serialize.js'
import { attachBookingNames } from '../utils/names.js'
import { isValidObjectId } from '../validators/index.js'

export const getMe = asyncHandler(async (req, res) => {
  let profile = await TutorProfile.findOne({ user: req.user._id })
  if (!profile) {
    profile = await TutorProfile.create({ user: req.user._id })
  }
  res.json({ profile: toClient(profile) })
})

const PROFILE_UPDATABLE = ['subjects', 'experience', 'timings', 'rate', 'mode', 'areas', 'bio', 'qualifications']

export const updateMe = asyncHandler(async (req, res) => {
  let profile = await TutorProfile.findOne({ user: req.user._id })
  if (!profile) profile = await TutorProfile.create({ user: req.user._id })
  for (const key of PROFILE_UPDATABLE) {
    if (req.body[key] !== undefined) profile[key] = req.body[key]
  }
  const { rate, experience } = profile
  if (typeof rate === 'string' || typeof experience === 'string') {
    profile.rate = Number(rate) || 0
    profile.experience = Number(experience) || 0
  }
  await profile.save()
  res.json({ profile: toClient(profile) })
})

export const listBookings = asyncHandler(async (req, res) => {
  const bookings = await attachBookingNames(
    await Booking.find({ teacherId: req.user._id }).sort({ datetime: 1 }).lean()
  )
  res.json({ bookings: toClient(bookings) })
})

export const acceptBooking = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid booking ID')
  const booking = await Booking.findOne({ _id: id, teacherId: req.user._id, status: 'pending' })
  if (!booking) throw new ApiError(404, 'Booking not found')
  booking.status = 'accepted'
  await booking.save()
  res.json({ booking: toClient(booking) })
})

export const rejectBooking = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid booking ID')
  const booking = await Booking.findOne({ _id: id, teacherId: req.user._id, status: 'pending' })
  if (!booking) throw new ApiError(404, 'Booking not found')
  booking.status = 'rejected'
  await booking.save()
  res.json({ booking: toClient(booking) })
})

export const listMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ teacherId: req.user._id }).sort({ createdAt: -1 }).lean()
  res.json({ reviews: toClient(reviews) })
})

export const listMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ teacherId: req.user._id }).sort({ createdAt: -1 }).lean()
  res.json({ payments: toClient(payments) })
})

export const myStats = asyncHandler(async (req, res) => {
  const [completed, reviews] = await Promise.all([
    Booking.find({ teacherId: req.user._id, status: 'completed' }).lean(),
    Review.find({ teacherId: req.user._id }).lean(),
  ])
  const totalEarnings = completed.reduce((s, b) => s + Number(b.price || 0), 0)
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0
  res.json({
    stats: {
      totalEarnings,
      completedSessions: completed.length,
      avgRating: Number(avgRating.toFixed(2)),
    },
  })
})