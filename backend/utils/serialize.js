function isObjectId(v) {
  return Boolean(v && typeof v === 'object' && typeof v.toHexString === 'function')
}

// ObjectId values nested inside arrays are stringified too (e.g. arrays of refs).
function stringifyValue(v) {
  if (isObjectId(v)) return v.toHexString()
  if (Array.isArray(v)) return v.map(stringifyValue)
  return v
}

// Converts a Mongoose doc / lean object into the plain client-facing shape the
// React frontend expects (id string from _id, ObjectIds stringified, no internals).
export function toClient(doc) {
  if (doc == null) return null
  if (Array.isArray(doc)) return doc.map(toClient)
  const plain = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc }
  for (const key of Object.keys(plain)) {
    plain[key] = stringifyValue(plain[key])
  }
  if (plain._id) plain.id = typeof plain._id === 'string' ? plain._id : String(plain._id)
  delete plain._id
  delete plain.__v
  delete plain.passwordHash
  return plain
}

// User-facing summary: never exposes passwordHash.
export function serializeUser(doc) {
  if (!doc) return null
  const plain = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc }
  return {
    id: String(plain._id || plain.id),
    role: plain.role,
    name: plain.name,
    email: plain.email,
    phone: plain.phone,
    approved: Boolean(plain.approved),
  }
}