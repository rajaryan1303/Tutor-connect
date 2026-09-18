import { Router } from 'express'
import {
  listUsers,
  listBookings,
  getTeacherDetail,
  analytics,
  approveTeacher,
  releasePayout,
} from '../controllers/adminController.js'
import { authAndRole } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/users', authAndRole('admin'), listUsers)
router.get('/bookings', authAndRole('admin'), listBookings)
router.get('/teachers/:id', authAndRole('admin'), getTeacherDetail)
router.get('/analytics', authAndRole('admin'), analytics)
router.post('/teachers/:id/approve', authAndRole('admin'), approveTeacher)
router.post('/payouts/release', authAndRole('admin'), releasePayout)

export default router