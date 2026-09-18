import { Router } from 'express'
import { createReview, listReviews, listMyReviews, deleteReview } from '../controllers/reviewController.js'
import { authAndRole } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/', authAndRole('student'), createReview)
router.get('/me', authAndRole('student'), listMyReviews)
router.get('/teacher/:id', listReviews)
router.delete('/:id', authAndRole('admin'), deleteReview)

export default router