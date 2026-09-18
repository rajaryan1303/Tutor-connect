import { Router } from 'express'
import { getMe, updateMe, listTeachers, cancelBooking } from '../controllers/studentController.js'
import { authAndRole } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/me', authAndRole('student'), getMe)
router.put('/me', authAndRole('student'), updateMe)
router.get('/teachers', authAndRole('student'), listTeachers)
router.delete('/me/bookings/:id', authAndRole('student'), cancelBooking)

export default router