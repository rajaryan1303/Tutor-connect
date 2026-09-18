import { Router } from 'express'
import {
  listBookings,
  createBooking,
  getBookingById,
  updateBooking,
  completeBooking,
} from '../controllers/bookingController.js'
import { authAndRole, authRequired } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/', authRequired, listBookings)
router.post('/', authAndRole('student'), createBooking)
router.get('/:id', authRequired, getBookingById)
router.put('/:id', authAndRole('student'), updateBooking)
router.post('/:id/complete', authAndRole('teacher'), completeBooking)

export default router