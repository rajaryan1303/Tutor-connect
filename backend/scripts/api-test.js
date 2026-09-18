import 'dotenv/config'
import mongoose from 'mongoose'
import { startTestServer, stopTestServer } from './helpers.js'

let base
let results = { pass: 0, fail: 0 }
const failures = []

function check(name, cond, detail) {
  if (cond) results.pass++
  else {
    results.fail++
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
  }
}

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let json = null
  try { json = await res.json() } catch { /* no body */ }
  return { status: res.status, body: json }
}

async function login(email, password) {
  const r = await req('POST', '/auth/login', { body: { email, password } })
  return { token: r.body?.token, user: r.body?.user, status: r.status }
}

// ---------------------------------------------------------------- tests
async function runTests() {
  // --- Health -----------------------------------------------------------
  let r = await req('GET', '/api/health')
  check('health returns success', r.status === 200 && r.body?.success === true, JSON.stringify(r.body))

  // --- Registration -----------------------------------------------------
  r = await req('POST', '/auth/register', { body: { role: 'student', name: 'Test Student', email: 'test.student@example.com', phone: '+111', password: 'secret123' } })
  check('student register returns token+user', r.status === 200 && r.body?.token && r.body?.user?.role === 'student' && r.body?.user?.approved === true, JSON.stringify(r.body))
  const testStudent = { token: r.body.token, id: r.body.user.id }

  r = await req('POST', '/auth/register', { body: { role: 'teacher', name: 'Test Teacher', email: 'test.teacher@example.com', phone: '+111', password: 'secret123' } })
  check('teacher register starts unapproved', r.status === 200 && r.body?.user?.role === 'teacher' && r.body?.user?.approved === false, JSON.stringify(r.body))
  const testTeacher = { token: r.body.token, id: r.body.user.id }

  r = await req('POST', '/auth/register', { body: { role: 'student', name: 'Dup', email: 'test.student@example.com', password: 'secret123' } })
  check('duplicate email rejected', r.status === 400, JSON.stringify(r.body))

  r = await req('POST', '/auth/register', { body: { role: 'admin', name: 'Hax', email: 'hax@example.com', password: 'secret123' } })
  check('invalid role rejected', r.status === 400, JSON.stringify(r.body))

  // --- Login ------------------------------------------------------------
  r = await login('test.student@example.com', 'wrongpass')
  check('invalid credentials rejected', r.status === 400, JSON.stringify(r.body))

  const admin = await login('admin@tutorconnect.com', 'admin123')
  check('admin login works', admin.status === 200 && admin.token, JSON.stringify(admin.body))
  const alex = await login('raj@123com', 'admin123')
  check('student login works', alex.status === 200 && alex.token)
  const sarah = await login('sarah@example.com', 'admin123')
  check('teacher login works', sarah.status === 200 && sarah.token)
  const emily = await login('emily@example.com', 'admin123')
  check('pending teacher login works', emily.status === 200 && emily.token)

  r = await req('GET', '/auth/me', { token: alex.token })
  check('/auth/me returns user', r.status === 200 && r.body?.user?.email === 'raj@123com', JSON.stringify(r.body))

  // --- Protected routes -------------------------------------------------
  r = await req('GET', '/students/me')
  check('no token -> 401', r.status === 401)
  r = await req('GET', '/students/me', { token: 'garbage.token.here' })
  check('invalid token -> 401', r.status === 401)
  r = await req('GET', '/students/me', { token: sarah.token })
  check('teacher blocked from student route -> 403', r.status === 403)
  r = await req('GET', '/teachers/me', { token: alex.token })
  check('student blocked from teacher route -> 403', r.status === 403)
  r = await req('GET', '/admin/analytics', { token: alex.token })
  check('non-admin blocked from admin route -> 403', r.status === 403)

  // --- Student profile --------------------------------------------------
  r = await req('GET', '/students/me', { token: alex.token })
  check('student can read profile', r.status === 200 && r.body?.profile?.name === 'Rohan Gupta', JSON.stringify(r.body))
  r = await req('PUT', '/students/me', { token: alex.token, body: { name: 'Alex Updated', phone: '+999' } })
  check('student can update profile', r.status === 200 && r.body?.profile?.name === 'Alex Updated')

  // --- Tutor discovery --------------------------------------------------
  r = await req('GET', '/students/teachers', { token: alex.token })
  check('teacher listing returns approved only', r.status === 200 && r.body?.teachers?.length === 2, JSON.stringify(r.body?.teachers?.map(t => t.name)))
  const sarahId = r.body.teachers.find(t => t.name === 'Dr. Priya Sharma')?.id
  check('teacher listing exposes id/name/rate', Boolean(sarahId) && r.body.teachers[0]?.rate !== undefined)

  r = await req('GET', '/students/teachers?subject=Mathematics', { token: alex.token })
  check('subject filter works', r.body?.teachers?.every(t => t.subjects.includes('Mathematics')))
  r = await req('GET', '/students/teachers?maxRate=600', { token: alex.token })
  check('maxRate filter works', r.body?.teachers?.every(t => t.rate <= 600) && r.body?.teachers?.length === 1)
  r = await req('GET', '/students/teachers?mode=online', { token: alex.token })
  check('mode filter works', r.body?.teachers?.every(t => t.mode === 'online' || t.mode === 'both'))
  r = await req('GET', '/students/teachers?subject=English', { token: alex.token })
  check('unapproved tutor hidden from search', r.body?.teachers?.length === 0)

  // --- Teacher profile --------------------------------------------------
  r = await req('GET', '/teachers/me', { token: sarah.token })
  check('teacher can read profile', r.status === 200 && r.body?.profile?.subjects?.length === 2, JSON.stringify(r.body))
  r = await req('PUT', '/teachers/me', { token: testTeacher.token, body: { subjects: ['Chemistry', 'Biology'], experience: 3, timings: ['Morning'], rate: 600, mode: 'both', areas: ['Indiranagar'], bio: 'I love science' } })
  check('tutor updates profile', r.status === 200 && r.body?.profile?.rate === 600 && r.body?.profile?.subjects?.includes('Chemistry'))

  // --- Bookings ---------------------------------------------------------
  const futureSlot = new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString()
  r = await req('POST', '/bookings', { token: testStudent.token, body: { teacherId: sarahId, subject: 'Mathematics', mode: 'online', datetime: futureSlot, price: 5 } })
  check('student creates booking', r.status === 200 && r.body?.booking?.status === 'pending', JSON.stringify(r.body))
  check('server computes amount from tutor rate', r.body?.booking?.price === 500, JSON.stringify(r.body?.booking?.price))
  const newBookingId = r.body?.booking?.id

  r = await req('POST', '/bookings', { token: testStudent.token, body: { teacherId: sarahId, subject: 'Mathematics', mode: 'online', datetime: futureSlot, price: 50 } })
  check('conflicting slot -> 409', r.status === 409, JSON.stringify(r.body))

  r = await req('POST', '/bookings', { token: testStudent.token, body: { teacherId: sarahId, subject: 'Mathematics', mode: 'online', datetime: new Date(Date.now() - 1000).toISOString(), price: 50 } })
  check('past datetime rejected', r.status === 400, JSON.stringify(r.body))

  r = await req('POST', '/bookings', { token: testStudent.token, body: { teacherId: '000000000000000000000000', subject: 'Math', mode: 'online', datetime: futureSlot, price: 10 } })
  check('invalid tutor rejected', r.status === 404, JSON.stringify(r.body))

  r = await req('POST', '/bookings', { token: sarah.token, body: { teacherId: sarahId, subject: 'Math', mode: 'online', datetime: futureSlot, price: 10 } })
  check('teacher cannot book (role)', r.status === 403)

  r = await req('GET', '/bookings', { token: alex.token })
  const alexBookingIds = (r.body?.bookings || []).map(b => b.studentId)
  check('student sees only own bookings', alexBookingIds.every(id => id === alex.user?.id), JSON.stringify(r.body?.bookings))
  const alexBooking = r.body?.bookings?.find(b => b.status === 'accepted') // bk4 alex->michael

  r = await req('GET', '/bookings/nope', { token: alex.token })
  check('invalid booking id -> 400', r.status === 400)

  // --- Payments ---------------------------------------------------------
  r = await req('POST', '/payments/pay', { token: testStudent.token, body: { bookingId: newBookingId } })
  check('payment created (paid)', r.status === 200 && r.body?.payment?.status === 'paid' && r.body?.payment?.amount === 500, JSON.stringify(r.body))

  r = await req('POST', '/payments/pay', { token: testStudent.token, body: { bookingId: newBookingId } })
  check('duplicate payment -> 409', r.status === 409, JSON.stringify(r.body))

  r = await req('POST', '/payments/pay', { token: testStudent.token, body: { bookingId: alexBooking?.id } })
  check('paying another student booking -> 403/404', [403, 404, 400].includes(r.status), JSON.stringify(r.body))

  // fresh booking exercises the create-order + server-side verify flow
  const orderSlot = new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString()
  r = await req('POST', '/bookings', { token: testStudent.token, body: { teacherId: sarahId, subject: 'Physics', mode: 'online', datetime: orderSlot, price: 50 } })
  const orderBookingId = r.body?.booking?.id
  check('fresh booking created for order flow', Boolean(orderBookingId), JSON.stringify(r.body))

  r = await req('POST', '/payments/create-order', { token: testStudent.token, body: { bookingId: orderBookingId } })
  check('create-order works', r.status === 200 && r.body?.order?.id, JSON.stringify(r.body))

  const sandboxOrderId = r.body?.order?.id
  r = await req('POST', '/payments/verify', { token: testStudent.token, body: { bookingId: orderBookingId, orderId: sandboxOrderId, paymentId: 'pay_sandbox_1', signature: 'sandbox' } })
  check('sandbox verify marks paid', r.status === 200 && r.body?.payment?.status === 'paid', JSON.stringify(r.body))

  r = await req('POST', '/payments/verify', { token: testStudent.token, body: { bookingId: orderBookingId, orderId: sandboxOrderId, paymentId: 'pay_sandbox_1', signature: 'sandbox' } })
  check('duplicate verification -> 409', r.status === 409, JSON.stringify(r.body))

  r = await req('POST', '/payments/verify', { token: testStudent.token, body: { bookingId: orderBookingId, orderId: sandboxOrderId, paymentId: 'pay_sandbox_1', signature: 'tampered' } })
  check('sandbox signature enforced (malformed order id)', [400, 409].includes(r.status), JSON.stringify(r.body))

  r = await req('GET', '/payments/me', { token: admin.token })
  check('admin sees all payments', Array.isArray(r.body?.payments) && r.body?.payments?.length > 0, JSON.stringify(r.body?.payments?.length))

  // --- Tutor booking actions -------------------------------------------
  r = await req('GET', '/teachers/bookings', { token: sarah.token })
  const pendingSarah = r.body?.bookings?.find(b => b.status === 'pending')
  check('tutor sees pending bookings', Boolean(pendingSarah), JSON.stringify(r.body?.bookings))

  r = await req('POST', `/teachers/bookings/${pendingSarah?.id}/accept`, { token: sarah.token })
  check('tutor accepts booking', r.status === 200 && r.body?.booking?.status === 'accepted', JSON.stringify(r.body))

  const michael = await login('michael@example.com', 'admin123')
  r = await req('GET', '/teachers/bookings', { token: michael.token })
  const pendingMichael = r.body?.bookings?.find(b => b.status === 'pending')
  r = await req('POST', `/teachers/bookings/${pendingMichael?.id}/accept`, { token: michael.token })
  check('second tutor accepts booking', r.status === 200 && r.body?.booking?.status === 'accepted', JSON.stringify(r.body))
  const michaelAccepted = r.body?.booking

  r = await req('POST', `/bookings/${michaelAccepted?.id}/complete`, { token: michael.token })
  check('tutor completes accepted booking', r.status === 200 && r.body?.booking?.status === 'completed', JSON.stringify(r.body))

  r = await req('POST', `/teachers/bookings/${pendingSarah?.id}/reject`, { token: sarah.token })
  check('cannot act twice on same booking', r.status === 404, JSON.stringify(r.body))

  r = await req('POST', '/teachers/bookings/junk/accept', { token: sarah.token })
  check('malformed booking id -> 400', r.status === 400, JSON.stringify(r.body))

  r = await req('POST', '/teachers/bookings/000000000000000000000000/accept', { token: sarah.token })
  check('non-existent booking -> 404', r.status === 404, JSON.stringify(r.body))

  // --- Reviews ----------------------------------------------------------
  // create a fresh alex->sarah booking and take it through to completed so it is reviewable
  const reviewSlot = new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString()
  r = await req('POST', '/bookings', { token: alex.token, body: { teacherId: sarahId, subject: 'Mathematics', mode: 'online', datetime: reviewSlot, price: 50 } })
  const reviewBookingId = r.body?.booking?.id
  await req('POST', '/payments/pay', { token: alex.token, body: { bookingId: reviewBookingId } })
  await req('POST', `/teachers/bookings/${reviewBookingId}/accept`, { token: sarah.token })
  await req('POST', `/bookings/${reviewBookingId}/complete`, { token: sarah.token })

  r = await req('GET', '/bookings', { token: alex.token })
  const freshBookings = r.body?.bookings
  const freshCompleted = freshBookings?.find(b => b.id === reviewBookingId)
  const alexAccepted = freshBookings?.find(b => b.status === 'accepted') // bk4 alex->michael (not completed)
  check('fresh completed booking reviewable', freshCompleted?.status === 'completed', JSON.stringify(freshCompleted))

  r = await req('POST', '/reviews', { token: alex.token, body: { bookingId: alexAccepted?.id, rating: 4, comment: 'Great session!' } })
  check('review on non-completed own booking rejected', [400, 404].includes(r.status), JSON.stringify(r.body))

  r = await req('POST', '/reviews', { token: alex.token, body: { bookingId: reviewBookingId, rating: 6, comment: 'high' } })
  check('rating out of range rejected', r.status === 400, JSON.stringify(r.body))

  r = await req('POST', '/reviews', { token: alex.token, body: { bookingId: reviewBookingId, rating: 5, comment: 'Wonderful teacher!' } })
  const createdReviewId = r.body?.review?.id
  check('review submitted', r.status === 200 && r.body?.review?.rating === 5, JSON.stringify(r.body))

  r = await req('POST', '/reviews', { token: alex.token, body: { bookingId: reviewBookingId, rating: 5, comment: 'again' } })
  check('duplicate review rejected', r.status === 409, JSON.stringify(r.body))

  r = await req('GET', `/reviews/teacher/${sarahId}`)
  check('public reviews for teacher', Array.isArray(r.body?.reviews) && r.body?.reviews?.length > 0)
  r = await req('GET', '/reviews/teacher/all')
  check('all reviews endpoint', r.body?.reviews?.length >= 4, JSON.stringify(r.body?.reviews?.length))

  r = await req('GET', '/students/teachers?subject=Mathematics', { token: alex.token })
  const sarahRating = r.body?.teachers?.[0]?.ratings
  check('tutor ratings recomputed from reviews', Boolean(sarahRating && sarahRating.count >= 3 && sarahRating.avg >= 4.5), JSON.stringify(sarahRating))

  // admin review moderation
  r = await req('DELETE', `/reviews/${createdReviewId}`, { token: admin.token })
  check('admin deletes a review', r.status === 200 && r.body?.success === true, JSON.stringify(r.body))
  r = await req('DELETE', `/reviews/${createdReviewId}`, { token: alex.token })
  check('students cannot delete reviews', r.status === 403, JSON.stringify(r.body))

  // --- Admin ------------------------------------------------------------
  r = await req('GET', '/admin/users', { token: admin.token })
  check('admin lists users', r.status === 200 && r.body?.users?.length >= 6 && r.body?.users?.every(u => !u.passwordHash), JSON.stringify(r.body?.users?.length))

  r = await req('POST', `/admin/teachers/${emily.user?.id}/approve`, { token: admin.token })
  check('admin approves teacher', r.status === 200 && r.body?.user?.approved === true, JSON.stringify(r.body))

  r = await req('GET', '/admin/analytics', { token: admin.token })
  check('admin analytics totals', r.status === 200 && r.body?.totals?.users >= 6 && r.body?.totals?.revenue > 0, JSON.stringify(r.body?.totals))

  // create + pay + release payout flow for admin payout release
  const paySlot = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString()
  r = await req('POST', '/bookings', { token: testStudent.token, body: { teacherId: sarahId, subject: 'Physics', mode: 'online', datetime: paySlot, price: 50 } })
  const payBookingId = r.body?.booking?.id
  await req('POST', '/payments/pay', { token: testStudent.token, body: { bookingId: payBookingId } })

  const sarahLogin = await login('sarah@example.com', 'admin123')
  r = await req('POST', `/teachers/bookings/${payBookingId}/accept`, { token: sarahLogin.token })
  check('accept for payout flow', r.status === 200)
  await req('POST', `/bookings/${payBookingId}/complete`, { token: sarahLogin.token })

  r = await req('POST', '/admin/payouts/release', { token: admin.token, body: { bookingId: payBookingId } })
  check('admin releases payout', r.status === 200 && r.body?.payment?.status === 'released', JSON.stringify(r.body))

  r = await req('POST', '/admin/payouts/release', { token: admin.token, body: { bookingId: payBookingId } })
  check('double release rejected', r.status === 400, JSON.stringify(r.body))

  r = await req('PUT', `/bookings/${reviewBookingId}`, { token: testStudent.token, body: { subject: 'Math II' } })
  check('non-owner cannot edit booking', r.status === 403, JSON.stringify(r.body))
}

// ---------------------------------------------------------------- main
try {
  const helpers = await startTestServer()
  base = helpers.base
  console.log(`Test server listening on ${base}\n`)
  await runTests()
  console.log(`\n${'='.repeat(60)}`)
  console.log(`PASS: ${results.pass}   FAIL: ${results.fail}`)
  if (failures.length) {
    console.log('\nFailed checks:')
    failures.forEach(f => console.log(`  ✗ ${f}`))
  }
  await helpers.server.close()
  await mongoose.disconnect()
  await stopTestServer()
  process.exit(results.fail ? 1 : 0)
} catch (e) {
  console.error('Test run crashed:', e)
  try { await mongoose.disconnect() } catch {}
  try { await stopTestServer() } catch {}
  process.exit(1)
}