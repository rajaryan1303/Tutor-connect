import User from '../models/User.js'
import TutorProfile from '../models/TutorProfile.js'
import Booking from '../models/Booking.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { serializeUser, toClient } from '../utils/serialize.js'
import { isValidObjectId } from '../validators/index.js'

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ profile: serializeUser(user) })
})

const STUDENT_UPDATABLE = ['name', 'phone']

export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  for (const key of STUDENT_UPDATABLE) {
    if (req.body[key] !== undefined) user[key] = req.body[key]
  }
  if (req.body.email !== undefined && req.body.email !== user.email) {
    const clash = await User.findOne({ email: String(req.body.email).trim().toLowerCase() })
    if (clash) throw new ApiError(400, 'Email already used')
    user.email = String(req.body.email).trim().toLowerCase()
  }
  await user.save()
  res.json({ profile: serializeUser(user) })
})

// Public tutor directory consumed by the Student Dashboard.
export const listTeachers = asyncHandler(async (req, res) => {
  const { subject, location, mode, minRate, maxRate } = req.query

  const filter = {}
  if (subject) filter.subjects = { $in: [String(subject)] }
  if (location) filter.areas = { $in: [String(location)] }
  if (mode && mode !== 'both') filter.mode = { $in: [String(mode), 'both'] }
  if (minRate) filter.rate = { ...(filter.rate || {}), $gte: Number(minRate) }
  if (maxRate) filter.rate = { ...(filter.rate || {}), $lte: Number(maxRate) }

  const approvedUsers = (await User.find({ role: 'teacher', approved: true }).select('_id').lean()).map(u => u._id)
  filter.user = { $in: approvedUsers }

  const profiles = await TutorProfile.find(filter).lean()

  const users = await User.find({ _id: { $in: profiles.map(p => p.user) }, role: 'teacher', approved: true }).lean()

  const userMap = new Map(users.map(u => [String(u._id), u]))

  const teachers = profiles
    .map(p => {
      const u = userMap.get(String(p.user))
      if (!u) return null
      return {
        id: String(u._id),
        name: u.name,
        email: u.email,
        phone: u.phone,
        approved: u.approved,
        subjects: p.subjects,
        experience: p.experience,
        timings: p.timings,
        rate: p.rate,
        mode: p.mode,
        areas: p.areas,
        bio: p.bio,
        qualifications: p.qualifications,
        ratings: p.ratings,
        completed: p.completed,
        earnings: p.earnings,
      }
    })
    .filter(Boolean)

  res.json({ teachers })
})

// DELETE /students/me/bookings/:id — cancel one of the student's own pending bookings.
export const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid booking ID')
  const booking = await Booking.findOne({ _id: id, studentId: req.user._id, status: 'pending' })
  if (!booking) throw new ApiError(404, 'Booking not found')
  booking.status = 'rejected'
  await booking.save()
  res.json({ booking: toClient(booking) })
})