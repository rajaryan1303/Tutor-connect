import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from './config/db.js'
import authRoutes from './routes/auth.js'
import studentRoutes from './routes/students.js'
import teacherRoutes from './routes/teachers.js'
import bookingRoutes from './routes/bookings.js'
import paymentRoutes from './routes/payments.js'
import adminRoutes from './routes/admin.js'
import reviewRoutes from './routes/reviews.js'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CORS
const allowed = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
app.use(
  cors({
    origin: allowed.length ? allowed : true,
    credentials: true,
  })
)

app.use(express.json({ limit: '1mb' }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Tutor-connect API is running' })
})

// API Routes (paths match the existing React frontend)
app.use('/auth', authRoutes)
app.use('/students', studentRoutes)
app.use('/teachers', teacherRoutes)
app.use('/bookings', bookingRoutes)
app.use('/payments', paymentRoutes)
app.use('/admin', adminRoutes)
app.use('/reviews', reviewRoutes)

// Serve the built React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

app.use(notFound)
app.use(errorHandler)

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename

if (isMain) {
  const PORT = process.env.PORT || 5000
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`  Server running on port ${PORT}`)
        console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`)
      })
    })
    .catch(err => {
      console.error('  MongoDB connection failed:', err.message)
      process.exit(1)
    })
}

export default app