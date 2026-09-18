import Booking from '../models/Booking.js'
import User from '../models/User.js'
import TutorProfile from '../models/TutorProfile.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { toClient } from '../utils/serialize.js'
import { attachBookingNames } from '../utils/names.js'
import { isValidObjectId, validateBooking } from '../validators/index.js'

// GET /bookings — scoped by role
export const listBookings = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.user.role === 'student') filter.studentId = req.user._id
  else if (req.user.role === 'teacher') filter.teacherId = req.user._id
  const bookings = await attachBookingNames(
    await Booking.find(filter).sort({ datetime: -1 }).lean()
  )
  res.json({ bookings: toClient(bookings) })
})

async function assertSlotFree(teacherId, datetime, excludeId) {
  const conflict = await Booking.findOne({
    _id: { $ne: excludeId },
    teacherId,
    datetime,
    status: { $in: ['pending', 'accepted'] },
  })
  if (conflict) throw new ApiError(409, 'This time slot is already booked')
}

// POST /bookings — student only. Server calculates the amount from the tutor's rate.
export const createBooking = asyncHandler(async (req, res) => {
  const input = validateBooking(req.body || {})

  if (!isValidObjectId(input.teacherId)) throw new ApiError(400, 'Invalid tutor ID')
  if (input.datetime.getTime() < Date.now()) throw new ApiError(400, 'Booking time cannot be in the past')

  const tutor = await User.findById(input.teacherId)
  if (!tutor || tutor.role !== 'teacher') throw new ApiError(404, 'Tutor not found')
  if (!tutor.approved) throw new ApiError(400, 'Tutor is not approved yet')
  if (String(tutor._id) === String(req.user._id)) throw new ApiError(400, 'Cannot book yourself')

  const profile = await TutorProfile.findOne({ user: tutor._id })
  if (!profile) throw new ApiError(400, 'Tutor profile not available')

  // Amount is computed server-side from the tutor's published rate.
  const rate = Number(profile.rate) || 0
  const price = rate > 0 ? rate : input.price

  await assertSlotFree(tutor._id, input.datetime, null)

  const booking = await Booking.create({
    studentId: req.user._id,
    teacherId: tutor._id,
    subject: input.subject,
    mode: input.mode,
    datetime: input.datetime,
    price,
    status: 'pending',
  })

  res.json({ booking: toClient(booking) })
})

export const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid booking ID')
  const booking = await Booking.findById(id)
  if (!booking) throw new ApiError(404, 'Booking not found')

  const isOwner = String(booking.studentId) === String(req.user._id)
  const isTutor = String(booking.teacherId) === String(req.user._id)
  const isAdmin = req.user.role === 'admin'
  if (!isOwner && !isTutor && !isAdmin) throw new ApiError(403, 'Forbidden')

  res.json({ booking: toClient(booking) })
})

// PUT /bookings/:id — student may edit their own pending booking.
export const updateBooking = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid booking ID')
  const booking = await Booking.findById(id)
  if (!booking) throw new ApiError(404, 'Booking not found')
  if (String(booking.studentId) !== String(req.user._id)) throw new ApiError(403, 'Forbidden')

  const updatable = {}
  if (req.body.subject !== undefined) updatable.subject = String(req.body.subject).trim()
  if (req.body.mode !== undefined) {
    if (!['online', 'offline', 'both'].includes(req.body.mode)) throw new ApiError(400, 'Invalid mode')
    updatable.mode = req.body.mode
  }
  if (req.body.datetime !== undefined) {
    const d = new Date(req.body.datetime)
    if (Number.isNaN(d.getTime())) throw new ApiError(400, 'Valid datetime is required')
    if (d.getTime() < Date.now()) throw new ApiError(400, 'Booking time cannot be in the past')
    updatable.datetime = d
  }

  if (updatable.datetime && String(booking.datetime) !== String(updatable.datetime)) {
    await assertSlotFree(booking.teacherId, updatable.datetime, booking._id)
  }

  for (const [k, v] of Object.entries(updatable)) booking[k] = v
  await booking.save()
  res.json({ booking: toClient(booking) })
})

// POST /bookings/:id/complete — tutor only, on an accepted booking.
export const completeBooking = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid booking ID')
  const booking = await Booking.findOne({ _id: id, teacherId: req.user._id })
  if (!booking) throw new ApiError(404, 'Booking not found')
  if (booking.status !== 'accepted') throw new ApiError(400, 'Only accepted bookings can be completed')
  booking.status = 'completed'
  await booking.save()

  await TutorProfile.updateOne({ user: req.user._id }, { $inc: { completed: 1 } })

  res.json({ booking: toClient(booking) })
})