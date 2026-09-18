import { verifyToken } from '../utils/token.js'
import User from '../models/User.js'

// Extracts and verifies the bearer token; loads the fresh user into req.user.
export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Authentication required' })
    const payload = verifyToken(token)
    const user = await User.findById(payload.id)
    if (!user) return res.status(401).json({ error: 'Invalid token' })
    req.user = user
    req.token = token
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Restrict access to one or more roles. Place AFTER authRequired.
export function roleRequired(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}

// Convenience: authRequired + restrict to roles in a single call.
export function authAndRole(...roles) {
  return [authRequired, roleRequired(...roles)]
}