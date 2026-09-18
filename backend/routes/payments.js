import { Router } from 'express'
import {
  pay,
  createOrderForBooking,
  verifyPayment,
  listMyPayments,
} from '../controllers/paymentController.js'
import { authAndRole, authRequired } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/pay', authAndRole('student'), pay)
router.post('/create-order', authAndRole('student'), createOrderForBooking)
router.post('/verify', authAndRole('student'), verifyPayment)
router.get('/me', authRequired, listMyPayments)

export default router