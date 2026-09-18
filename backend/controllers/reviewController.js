import Booking from '../models/Booking.js'
import Review from '../models/Review.js'
import TutorProfile from '../models/TutorProfile.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { toClient } from '../utils/serialize.js'
import { attachStudentNames } from '../utils/names.js'
import { isValidObjectId, validateReview } from '../validators/index.js'

async function refreshTutorRating(teacherId) {
  const reviews = await Review.find({ teacherId }).lean()
  if (reviews.length === 0) return
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  await TutorProfile.updateOne(
    { user: teacherId },
    { $set: { ratings: { avg: Number(avg.toFixed(2)), count: reviews.length } } }
  )
}

// POST /reviews — only students with a completed booking for that session.
export const createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = validateReview(req.body || {})
  if (!isValidObjectId(bookingId)) throw new ApiError(400, 'Invalid booking ID')

  const booking = await Booking.findById(bookingId)
  if (!booking) throw new ApiError(404, 'Booking not found')
  if (String(booking.studentId) !== String(req.user._id)) throw new ApiError(403, 'Forbidden')
  if (booking.status !== 'completed') throw new ApiError(400, 'Sessions must be completed before reviewing')

  const existing = await Review.findOne({ bookingId: booking._id })
  if (existing) throw new ApiError(409, 'You have already reviewed this session')

  const review = await Review.create({
    bookingId: booking._id,
    studentId: req.user._id,
    teacherId: booking.teacherId,
    rating,
    comment,
  })

  await refreshTutorRating(booking.teacherId)

  res.json({ review: toClient(review) })
})

// GET /reviews/teacher/:id — public tutor reviews. ':id' of 'all' returns every review (admin dashboard).
export const listReviews = asyncHandler(async (req, res) => {
  const { id } = req.params
  const filter = id && id !== 'all' ? { teacherId: id } : {}
  const reviews = await attachStudentNames(
    await Review.find(filter).sort({ createdAt: -1 }).lean()
  )
  res.json({ reviews: toClient(reviews) })
})

// GET /reviews/me — the student's own reviews (drives the "Leave a Review" state).
export const listMyReviews = asyncHandler(async (req, res) => {
  const reviews = await attachStudentNames(
    await Review.find({ studentId: req.user._id }).sort({ createdAt: -1 }).lean()
  )
  res.json({ reviews: toClient(reviews) })
})

// DELETE /reviews/:id — admin moderation removes a review and recomputes the tutor rating.
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid review ID')
  const review = await Review.findByIdAndDelete(id)
  if (!review) throw new ApiError(404, 'Review not found')
  await refreshTutorRating(review.teacherId)
  res.json({ success: true })
})