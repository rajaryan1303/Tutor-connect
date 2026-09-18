import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import TutorProfile from '../models/TutorProfile.js'
import { signToken } from '../utils/token.js'
import { serializeUser } from '../utils/serialize.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { validateRegister, validateLogin } from '../validators/index.js'

export const register = asyncHandler(async (req, res) => {
  const { role, name, email, phone, password } = validateRegister(req.body)

  const existing = await User.findOne({ email })
  if (existing) throw new ApiError(400, 'Email already used')

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({
    role,
    name,
    email,
    phone,
    passwordHash,
    approved: role !== 'teacher',
  })

  if (role === 'teacher') {
    await TutorProfile.create({ user: user._id })
  }

  res.json({ token: signToken(user), user: serializeUser(user) })
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = validateLogin(req.body)
  const user = await User.findOne({ email }).select('+passwordHash')
  if (!user) throw new ApiError(400, 'Invalid credentials')
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) throw new ApiError(400, 'Invalid credentials')
  res.json({ token: signToken(user), user: serializeUser(user) })
})

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ user: serializeUser(user) })
})