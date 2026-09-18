import mongoose from 'mongoose'

export function notFound(req, res, next) {
  return res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || 500
  let message = err.message || 'Something went wrong'

  if (err instanceof mongoose.Error.CastError) {
    status = 400
    message = 'Invalid ID format'
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400
    message = Object.values(err.errors).map(e => e.message).join(', ')
  } else if (err.code === 11000) {
    status = 409
    const field = Object.keys(err.keyPattern || {}).join(', ')
    message = `Duplicate value for ${field}`
  } else if (err.type === 'entity.parse.failed') {
    status = 400
    message = 'Invalid JSON body'
  }

  if (status >= 500) console.error(err)
  return res.status(status).json({ error: message })
}