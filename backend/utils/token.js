import jwt from 'jsonwebtoken'

// JWT secret must come from the environment — never hardcode a production secret.
function secret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not configured. See backend/.env.example')
  return s
}

export function signToken(user) {
  return jwt.sign(
    { id: String(user._id || user.id), role: user.role, name: user.name, email: user.email, approved: user.approved },
    secret(),
    { expiresIn: '7d' }
  )
}

export function verifyToken(token) {
  return jwt.verify(token, secret())
}