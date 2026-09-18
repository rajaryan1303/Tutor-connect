import bcrypt from 'bcryptjs'
import User from './models/User.js'
import TutorProfile from './models/TutorProfile.js'
import Booking from './models/Booking.js'
import Payment from './models/Payment.js'
import Review from './models/Review.js'

export async function seedData() {
  await Promise.all([
    User.deleteMany({}),
    TutorProfile.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Review.deleteMany({}),
  ])

  const hash = await bcrypt.hash('admin123', 10)

  const [admin, sarah, michael, emily, alex, jessica] = await User.insertMany([
    { role: 'admin', name: 'Platform Admin', email: 'admin@tutorconnect.com', phone: '+913000000000', passwordHash: hash, approved: true },
    { role: 'teacher', name: 'Dr. Priya Sharma', email: 'sarah@example.com', phone: '+913012345678', passwordHash: hash, approved: true },
    { role: 'teacher', name: 'Prof. Arjun Mehta', email: 'michael@example.com', phone: '+913076543210', passwordHash: hash, approved: true },
    { role: 'teacher', name: 'Ms. Kavya Iyer', email: 'emily@example.com', phone: '+913098765432', passwordHash: hash, approved: false },
    { role: 'student', name: 'Rohan Gupta', email: 'raj@123com', phone: '+919999000001', passwordHash: hash, approved: true },
    { role: 'student', name: 'Ananya Desai', email: 'jessica@example.com', phone: '+919999000002', passwordHash: hash, approved: true },
  ])

  await TutorProfile.create([
    { user: sarah._id, subjects: ['Mathematics', 'Physics'], experience: 8, timings: ['Morning', 'Evening'], rate: 500, mode: 'both', areas: ['Andheri', 'Bandra', 'Powai'], ratings: { avg: 4.5, count: 2 }, completed: 156, earnings: 78000 },
    { user: michael._id, subjects: ['Computer Science', 'Programming'], experience: 12, timings: ['Afternoon', 'Evening'], rate: 750, mode: 'online', areas: [], ratings: { avg: 5, count: 1 }, completed: 89, earnings: 66750 },
    { user: emily._id, subjects: ['English', 'Literature'], experience: 5, timings: ['Morning', 'Afternoon'], rate: 400, mode: 'offline', areas: ['Indiranagar', 'Koramangala'], ratings: { avg: 0, count: 0 }, completed: 0, earnings: 0 },
  ])

  const hours = n => new Date(Date.now() + n * 3600 * 1000)

  const [bk1, bk2, bk3, bk4, bk5, bk6] = await Booking.create([
    { studentId: alex._id, teacherId: sarah._id, subject: 'Mathematics', mode: 'online', datetime: hours(-48), price: 500, status: 'completed' },
    { studentId: alex._id, teacherId: sarah._id, subject: 'Physics', mode: 'offline', datetime: hours(-24), price: 500, status: 'completed' },
    { studentId: jessica._id, teacherId: michael._id, subject: 'Programming', mode: 'online', datetime: hours(-30), price: 750, status: 'completed' },
    { studentId: alex._id, teacherId: michael._id, subject: 'Computer Science', mode: 'online', datetime: hours(72), price: 750, status: 'accepted' },
    { studentId: jessica._id, teacherId: sarah._id, subject: 'Mathematics', mode: 'offline', datetime: hours(48), price: 500, status: 'pending' },
    { studentId: alex._id, teacherId: michael._id, subject: 'Programming', mode: 'online', datetime: hours(96), price: 750, status: 'pending' },
  ])

  await Payment.create([
    { bookingId: bk1._id, studentId: alex._id, teacherId: sarah._id, amount: 500, status: 'released', method: 'card' },
    { bookingId: bk2._id, studentId: alex._id, teacherId: sarah._id, amount: 500, status: 'released', method: 'card' },
    { bookingId: bk3._id, studentId: jessica._id, teacherId: michael._id, amount: 750, status: 'released', method: 'upi' },
    { bookingId: bk4._id, studentId: alex._id, teacherId: michael._id, amount: 750, status: 'paid', method: 'card' },
  ])

  await Review.create([
    { bookingId: bk1._id, studentId: alex._id, teacherId: sarah._id, rating: 5, comment: 'Excellent teacher! Very clear explanations and patient with questions.' },
    { bookingId: bk2._id, studentId: alex._id, teacherId: sarah._id, rating: 4, comment: 'Good session, helped me understand complex physics concepts.' },
    { bookingId: bk3._id, studentId: jessica._id, teacherId: michael._id, rating: 5, comment: 'Amazing programming mentor! Learned so much in one session.' },
  ])

  return { admin, sarah, michael, emily, alex, jessica }
}

export const SEED_ACCOUNTS = {
  admin: { email: 'admin@tutorconnect.com', password: 'admin123' },
  sarah: { email: 'sarah@example.com', password: 'admin123' },
  alex: { email: 'raj@123com', password: 'admin123' },
  jessica: { email: 'jessica@example.com', password: 'admin123' },
  emily: { email: 'emily@example.com', password: 'admin123' },
}