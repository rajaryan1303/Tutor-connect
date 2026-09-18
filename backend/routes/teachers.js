import { Router } from 'express'
import {
  getMe,
  updateMe,
  listBookings,
  acceptBooking,
  rejectBooking,
  listMyReviews,
  listMyPayments,
  myStats,
} from '../controllers/teacherController.js'
import { authAndRole } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/me', authAndRole('teacher'), getMe)
router.put('/me', authAndRole('teacher'), updateMe)
router.get('/bookings', authAndRole('teacher'), listBookings)
router.post('/bookings/:id/accept', authAndRole('teacher'), acceptBooking)
router.post('/bookings/:id/reject', authAndRole('teacher'), rejectBooking)
router.get('/me/reviews', authAndRole('teacher'), listMyReviews)
router.get('/me/payments', authAndRole('teacher'), listMyPayments)
router.get('/my-stats', authAndRole('teacher'), myStats)

export default router