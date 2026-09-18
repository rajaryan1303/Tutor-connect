import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { signToken, verifyToken } from '../utils/token.js'
import { toClient, serializeUser } from '../utils/serialize.js'
import { ApiError } from '../utils/ApiError.js'
import {
  validateRegister,
  validateLogin,
  validateBooking,
  validateReview,
  isValidObjectId,
} from '../validators/index.js'
import { notFound, errorHandler } from '../middleware/errorMiddleware.js'
import { startTestServer, stopTestServer } from './helpers.js'

// ================================================================
// WHITE-BOX testing — we test internals: utils, validators, middleware,
// controllers/models (via the HTTP pipeline) and measure coverage.
// ================================================================

describe('utils/token.js', () => {
  test('sign/verify roundtrip preserves payload', () => {
    const t = signToken({ _id: new mongoose.Types.ObjectId(), role: 'student', name: 'A', email: 'a@x.com', approved: true })
    const p = verifyToken(t)
    assert.equal(p.role, 'student')
    assert.ok(p.exp > p.iat)
  })

  test('tampered token throws', () => {
    const t = signToken({ _id: new mongoose.Types.ObjectId(), role: 'admin', name: 'A', email: 'a@x.com', approved: true })
    assert.throws(() => verifyToken(`${t.slice(0, -4)}xxxx`))
  })

  test('missing JWT_SECRET throws (no hardcoded fallback)', () => {
    const saved = process.env.JWT_SECRET
    delete process.env.JWT_SECRET
    try {
      assert.throws(() => signToken({ _id: new mongoose.Types.ObjectId(), role: 'student' }), /JWT_SECRET/)
      assert.throws(() => verifyToken('a.b.c'), /JWT_SECRET/)
    } finally {
      process.env.JWT_SECRET = saved
    }
  })
})

describe('utils/serialize.js', () => {
  test('toClient null', () => assert.equal(toClient(null), null))
  test('toClient undefined', () => assert.equal(toClient(undefined), null))

  test('toClient maps arrays of docs', () => {
    const arr = toClient([{ _id: 'a'.repeat(24), passwordHash: 'x', name: 'A' }])
    assert.equal(arr.length, 1)
    assert.equal(arr[0].id, 'a'.repeat(24))
    assert.equal(arr[0].passwordHash, undefined)
    assert.equal(arr[0]._id, undefined)
  })

  test('toClient stringifies ObjectIds in nested fields', () => {
    const oid = new mongoose.Types.ObjectId()
    const out = toClient({ _id: oid, ref: oid, list: [oid], name: 'A', __v: 0 })
    assert.equal(out.id, oid.toHexString())
    assert.equal(out._id, undefined)
    assert.equal(out.__v, undefined)
    assert.equal(out.ref, oid.toHexString())
    assert.equal(out.list[0], oid.toHexString())
  })

  test('toClient drops passwordHash from a mongoose doc', async () => {
    const u = await mongoose.model('User').create({ name: 'T', email: 't@x.com', passwordHash: 'hash', role: 'student' })
    const out = toClient(u)
    assert.equal(out.passwordHash, undefined)
    assert.ok(out.id)
  })

  test('serializeUser never leaks passwordHash and coerces approved', () => {
    const out = serializeUser({ _id: new mongoose.Types.ObjectId(), role: 'teacher', name: 'N', email: 'n@x.com', phone: '1', approved: 1, passwordHash: 'secret' })
    assert.equal(out.passwordHash, undefined)
    assert.equal(out.approved, true)
    assert.ok(out.id)
  })

  test('serializeUser null', () => assert.equal(serializeUser(null), null))
})

describe('utils/ApiError.js', () => {
  test('is an Error carrying status', () => {
    const e = new ApiError(409, 'boom')
    assert.ok(e instanceof Error)
    assert.equal(e.status, 409)
    assert.equal(e.message, 'boom')
  })
})

describe('validators/index.js', () => {
  test('validateRegister passes and normalizes', () => {
    const o = validateRegister({ role: 'student', name: '  A  ', email: 'A@X.com', phone: '+91', password: 'secret' })
    assert.equal(o.name, 'A')
    assert.equal(o.email, 'a@x.com')
  })
  test('validateRegister rejects bad inputs', () => {
    for (const [body, msg] of [
      [{ role: 'admin', name: 'A', email: 'a@x.com', password: 'secret' }, /role/],
      [{ role: 'student', name: ' ', email: 'a@x.com', password: 'secret' }, /Name/],
      [{ role: 'student', name: 'A', email: 'nope', password: 'secret' }, /email/i],
      [{ role: 'student', name: 'A', email: 'a@x.com', password: '123' }, /6 characters/],
    ]) {
      assert.throws(() => validateRegister(body), e => e instanceof ApiError && e.status === 400 && msg.test(e.message))
    }
  })

  test('validateLogin requires both fields', () => {
    assert.throws(() => validateLogin({ email: 'a' }), /Email and password/)
    const o = validateLogin({ email: ' A@X.com ', password: 'p' })
    assert.equal(o.email, 'a@x.com')
  })

  test('validateBooking branches', () => {
    const valid = { teacherId: 'a'.repeat(24), subject: ' Math ', mode: 'online', datetime: new Date().toISOString(), price: 5 }
    const o = validateBooking(valid)
    assert.equal(o.subject, 'Math')
    assert.equal(o.price, 5)

    for (const bad of [
      { ...valid, teacherId: '' },
      { ...valid, subject: '  ' },
      { ...valid, mode: 'teleport' },
      { ...valid, datetime: 'not-a-date' },
      { ...valid, price: -1 },
      { ...valid, price: undefined },
    ]) {
      assert.throws(() => validateBooking(bad), e => e instanceof ApiError)
    }
  })

  test('validateReview branches', () => {
    const ok = { bookingId: 'a'.repeat(24), rating: 5, comment: 'nice' }
    assert.equal(validateReview(ok).rating, 5)
    for (const bad of [
      { bookingId: '' },
      { bookingId: 'a'.repeat(24), rating: 0 },
      { bookingId: 'a'.repeat(24), rating: 6 },
      { bookingId: 'a'.repeat(24), rating: 2.5 },
      { bookingId: 'a'.repeat(24), rating: 'x' },
    ]) {
      assert.throws(() => validateReview(bad), e => e instanceof ApiError && e.status === 400)
    }
  })

  test('isValidObjectId accepts 24-hex only', () => {
    assert.ok(isValidObjectId('a'.repeat(24)))
    assert.ok(isValidObjectId('A'.repeat(24)))
    assert.ok(!isValidObjectId('a'.repeat(23)))
    assert.ok(!isValidObjectId('zzzzzz'.repeat(4)))
    assert.ok(!isValidObjectId('junk'))
    assert.ok(!isValidObjectId(null))
  })
})

describe('middleware/errorMiddleware.js', () => {
  function fakeRes() {
    const res = { statusCode: 200, body: undefined }
    res.status = n => { res.statusCode = n; return res }
    res.json = b => { res.body = b; return res }
    return res
  }

  test('notFound returns 404 JSON', () => {
    const res = fakeRes()
    notFound({ method: 'GET', originalUrl: '/x' }, res, () => {})
    assert.equal(res.statusCode, 404)
    assert.match(res.body.error, /Route not found/)
  })

  test('errorHandler branches', () => {
    const ve = new mongoose.Error.ValidationError()
    ve.errors = { a: { message: 'A' }, b: { message: 'B' } }
    const cases = [
      [new mongoose.Error.CastError('ObjectId', 'x', 'y'), 400, /Invalid ID/],
      [ve, 400, /A, B/],
      [{ code: 11000, keyPattern: { email: 1 } }, 409, /Duplicate value for email/],
      [{ type: 'entity.parse.failed', message: 'bad' }, 400, /Invalid JSON body/],
      [new ApiError(403, 'Forbidden'), 403, /Forbidden/],
    ]
    for (const [err, status, re] of cases) {
      const res = fakeRes()
      errorHandler(err, {}, res, () => {})
      assert.equal(res.statusCode, status, `status for ${err.constructor?.name || JSON.stringify(err)}`)
      assert.match(res.body.error, re)
    }
  })

  test('errorHandler masks 500 with message and swallows error log noise', () => {
    const prev = console.error
    console.error = () => {}
    try {
      const res = fakeRes()
      errorHandler(new Error('kaboom'), {}, res, () => {})
      assert.equal(res.statusCode, 500)
      assert.equal(res.body.error, 'kaboom')
    } finally {
      console.error = prev
    }
  })
})

// ================================================================
// BRANCH PROBES through the real HTTP pipeline (white-box: driven
// with knowledge of models/controllers, but exercised via the app).
// ================================================================
let base
let server

before(async () => {
  const h = await startTestServer()
  base = h.base
  server = h.server
})

after(async () => {
  if (server) await server.close()
  await mongoose.disconnect()
  await stopTestServer()
})

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  let json = null
  try { json = await res.json() } catch { /* no body */ }
  return { status: res.status, body: json }
}

async function login(email, password) {
  const r = await req('POST', '/auth/login', { body: { email, password } })
  return { token: r.body?.token, user: r.body?.user }
}

describe('HTTP pipeline branch probes', () => {
  test('health endpoint', async () => {
    const r = await req('GET', '/api/health')
    assert.equal(r.status, 200)
    assert.equal(r.body.success, true)
  })

  test('auth register login + token guards', async () => {
    const reg = await req('POST', '/auth/register', { body: { role: 'student', name: 'WB', email: 'wb@x.com', password: 'secret1' } })
    assert.equal(reg.status, 200)
    assert.ok(reg.body.token)
    assert.equal(reg.body.user.role, 'student')
    assert.equal(reg.body.user.passwordHash, undefined)

    const l = await login('wb@x.com', 'wrongpass')
    assert.equal(l.token, undefined)
    const dup = await req('POST', '/auth/register', { body: { role: 'student', name: 'W2', email: 'wb@x.com', password: 'secret1' } })
    assert.equal(dup.status, 400) // unique index surfaced as 400 in controller

    assert.equal((await req('GET', '/students/me')).status, 401)
    assert.equal((await req('GET', '/students/me', { token: 'junk.jwt' })).status, 401)
    const t = await login('raj@123com', 'admin123')
    assert.equal((await req('GET', '/teachers/me', { token: t.token })).status, 403) // student -> teacher
    const admin = await login('admin@tutorconnect.com', 'admin123')
    assert.equal((await req('GET', '/teachers/me', { token: admin.token })).status, 403) // admin -> teacher
    assert.equal((await req('GET', '/students/me', { token: admin.token })).status, 403)
  })

  test('booking creation branches (server price, conflict, past, invalid ids)', async () => {
    const s = await login('raj@123com', 'admin123')
    const teacher = await req('GET', '/students/teachers', { token: s.token })
    const sarahId = teacher.body.teachers.find(t => t.name === 'Dr. Priya Sharma').id

    const slot = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
    const r = await req('POST', '/bookings', { token: s.token, body: { teacherId: sarahId, subject: 'Maths', mode: 'online', datetime: slot, price: 999 } })
    assert.equal(r.status, 200)
    assert.equal(r.body.booking.price, 500) // server-overrides client price from rate

    const conflict = await req('POST', '/bookings', { token: s.token, body: { teacherId: sarahId, subject: 'Maths', mode: 'online', datetime: slot, price: 500 } })
    assert.equal(conflict.status, 409)

    const past = await req('POST', '/bookings', { token: s.token, body: { teacherId: sarahId, subject: 'Maths', mode: 'online', datetime: new Date(Date.now() - 1).toISOString(), price: 500 } })
    assert.equal(past.status, 400)

    const junk = await req('POST', '/bookings', { token: s.token, body: { teacherId: 'junk-not-an-id', subject: 'Maths', mode: 'online', datetime: slot, price: 500 } })
    assert.equal(junk.status, 400)

    const missing = await req('POST', '/bookings', { token: s.token, body: { teacherId: '000000000000000000000000', subject: 'Maths', mode: 'online', datetime: slot, price: 500 } })
    assert.equal(missing.status, 404)
  })

  test('review lifecycle + rating recompute on teacher profile', async () => {
    const s = await login('raj@123com', 'admin123')
    const t = await login('sarah@example.com', 'admin123')
    const listing = await req('GET', '/students/teachers?subject=Mathematics', { token: s.token })
    const sarahId = listing.body.teachers.find(x => x.name === 'Dr. Priya Sharma').id
    const before = listing.body.teachers.find(x => x.name === 'Dr. Priya Sharma').ratings.count

    const slot = new Date(Date.now() + 40 * 24 * 3600 * 1000).toISOString()
    const bk = await req('POST', '/bookings', { token: s.token, body: { teacherId: sarahId, subject: 'Maths', mode: 'online', datetime: slot, price: 500 } })
    const id = bk.body.booking.id
    await req('POST', '/payments/pay', { token: s.token, body: { bookingId: id } })
    await req('POST', `/teachers/bookings/${id}/accept`, { token: t.token })
    await req('POST', `/bookings/${id}/complete`, { token: t.token })

    const bad = await req('POST', '/reviews', { token: s.token, body: { bookingId: id, rating: 9 } }) // range
    assert.equal(bad.status, 400)
    const ok = await req('POST', '/reviews', { token: s.token, body: { bookingId: id, rating: 5, comment: 'White-box review' } })
    assert.equal(ok.status, 200)
    assert.equal(ok.body.review.userId, undefined) // no internal fields
    const dup = await req('POST', '/reviews', { token: s.token, body: { bookingId: id, rating: 3 } })
    assert.equal(dup.status, 409)

    const after = await req('GET', '/students/teachers?subject=Mathematics', { token: s.token })
    const ratings = after.body.teachers.find(x => x.name === 'Dr. Priya Sharma').ratings
    assert.equal(ratings.count, before + 1)
  })

  test('payment order/verify + duplicate/ownership branches', async () => {
    const s = await login('raj@123com', 'admin123')
    const t = await login('sarah@example.com', 'admin123')
    const listing = await req('GET', '/students/teachers', { token: s.token })
    const sarahId = listing.body.teachers[0].id
    const slot = new Date(Date.now() + 50 * 24 * 3600 * 1000).toISOString()
    const bk = await req('POST', '/bookings', { token: s.token, body: { teacherId: sarahId, subject: 'Maths', mode: 'online', datetime: slot, price: 500 } })
    const id = bk.body.booking.id

    const order = await req('POST', '/payments/create-order', { token: s.token, body: { bookingId: id } })
    assert.equal(order.status, 200)
    assert.ok(order.body.order.id)
    assert.equal(order.body.order.currency, 'INR')

    const v = await req('POST', '/payments/verify', { token: s.token, body: { bookingId: id, orderId: order.body.order.id, paymentId: 'pay_x', signature: 'sandbox' } })
    assert.equal(v.status, 200)
    assert.equal(v.body.payment.status, 'paid')

    const dupV = await req('POST', '/payments/verify', { token: s.token, body: { bookingId: id, orderId: order.body.order.id, paymentId: 'pay_x', signature: 'sandbox' } })
    assert.equal(dupV.status, 409)

    const notOwner = await req('POST', '/payments/pay', { token: t.token, body: { bookingId: id } })
    assert.ok([403, 404, 400].includes(notOwner.status)) // non-owner cannot pay the booking
  })

  test('admin approve + payout idempotency branches', async () => {
    const admin = await login('admin@tutorconnect.com', 'admin123')
    const users = await req('GET', '/admin/users', { token: admin.token })
    const emily = users.body.users.find(u => u.email === 'emily@example.com')
    assert.ok(emily)
    assert.equal(emily.approved, false)
    assert.equal(emily.passwordHash, undefined)

    const appr = await req('POST', `/admin/teachers/${emily.id}/approve`, { token: admin.token })
    assert.equal(appr.status, 200)
    assert.equal(appr.body.user.approved, true)

    const s = await login('raj@123com', 'admin123')
    const t = await login('emily@example.com', 'admin123')
    const listing = await req('GET', '/students/teachers?subject=English', { token: s.token })
    const emilyId = listing.body.teachers[0].id
    const slot = new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString()
    const bk = await req('POST', '/bookings', { token: s.token, body: { teacherId: emilyId, subject: 'English', mode: 'online', datetime: slot, price: 400 } })
    const id = bk.body.booking.id
    await req('POST', '/payments/pay', { token: s.token, body: { bookingId: id } })
    await req('POST', `/teachers/bookings/${id}/accept`, { token: t.token })
    await req('POST', `/bookings/${id}/complete`, { token: t.token })

    const rel = await req('POST', '/admin/payouts/release', { token: admin.token, body: { bookingId: id } })
    assert.equal(rel.status, 200)
    assert.equal(rel.body.payment.status, 'released')
    const rel2 = await req('POST', '/admin/payouts/release', { token: admin.token, body: { bookingId: id } })
    assert.equal(rel2.status, 400) // double release idempotency guard

    // admin teacher detail (View Profile / View Details modal)
    const detail = await req('GET', `/admin/teachers/${emily.id}`, { token: admin.token })
    assert.equal(detail.status, 200)
    assert.equal(detail.body.user.role, 'teacher')
    assert.ok(detail.body.profile)
    assert.ok(detail.body.profile.subjects?.length)
    const badDetail = await req('GET', '/admin/teachers/not-an-id', { token: admin.token })
    assert.equal(badDetail.status, 400)
    assert.equal(badDetail.body.error, 'Invalid user ID')
    const missDetail = await req('GET', `/admin/teachers/${id}`, { token: admin.token })
    assert.equal(missDetail.status, 404) // the created booking's id is not a teacher
    const lockedDetail = await req('GET', `/admin/teachers/${emily.id}`, { token: s.token })
    assert.equal(lockedDetail.status, 403) // students cannot read teacher details
  })

  test('teacher & student profiles + stats + admin analytics (remaining branches)', async () => {
    const s = await login('raj@123com', 'admin123')
    const t = await login('sarah@example.com', 'admin123')
    const admin = await login('admin@tutorconnect.com', 'admin123')

    // teacher profile read + update + stats + reviews + payments
    const me = await req('GET', '/teachers/me', { token: t.token })
    assert.equal(me.status, 200)
    assert.ok(me.body.profile.id)
    assert.equal(me.body.profile.rate, 500)
    const upd = await req('PUT', '/teachers/me', { token: t.token, body: { rate: 550, experience: 9, subjects: ['Mathematics', 'Physics', 'Statistics'] } })
    assert.equal(upd.status, 200)
    assert.equal(upd.body.profile.rate, 550)

    const stats = await req('GET', '/teachers/my-stats', { token: t.token })
    assert.equal(stats.status, 200)
    assert.ok(stats.body.stats.totalEarnings > 0)

    const treviews = await req('GET', '/teachers/me/reviews', { token: t.token })
    assert.equal(treviews.status, 200)
    assert.ok(treviews.body.reviews.length > 0)

    const tpay = await req('GET', '/teachers/me/payments', { token: t.token })
    assert.equal(tpay.status, 200)
    assert.ok(Array.isArray(tpay.body.payments))

    const tbk = await req('GET', '/teachers/bookings', { token: t.token })
    assert.ok(Array.isArray(tbk.body.bookings))

    // student profile read + update + delete-cancel branches + payment list
    const spro = await req('GET', '/students/me', { token: s.token })
    assert.equal(spro.status, 200)
    const sedit = await req('PUT', '/students/me', { token: s.token, body: { phone: '+91111222333' } })
    assert.equal(sedit.status, 200)
    assert.equal(sedit.body.profile.phone, '+91111222333')

    const spays = await req('GET', '/payments/me', { token: s.token })
    assert.equal(spays.status, 200)
    assert.ok(Array.isArray(spays.body.payments))
    const apays = await req('GET', '/payments/me', { token: admin.token })
    assert.ok(apays.body.payments.length >= spays.body.payments.length)

    const sbk = await req('GET', '/bookings', { token: s.token })
    assert.ok(Array.isArray(sbk.body.bookings))

    // reject branch (fresh booking -> reject)
    const slot = new Date(Date.now() + 70 * 24 * 3600 * 1000).toISOString()
    const listing = await req('GET', '/students/teachers', { token: s.token })
    const michaelId = listing.body.teachers.find(x => x.name === 'Prof. Arjun Mehta').id
    const nbk = await req('POST', '/bookings', { token: s.token, body: { teacherId: michaelId, subject: 'Programming', mode: 'online', datetime: slot, price: 750 } })
    const mt = await login('michael@example.com', 'admin123')
    const reject = await req('POST', `/teachers/bookings/${nbk.body.booking.id}/reject`, { token: mt.token })
    assert.equal(reject.status, 200)
    assert.equal(reject.body.booking.status, 'rejected')
    const actAgain = await req('POST', `/teachers/bookings/${nbk.body.booking.id}/reject`, { token: mt.token })
    assert.equal(actAgain.status, 404) // already acted on

    // admin analytics + bookings
    const an = await req('GET', '/admin/analytics', { token: admin.token })
    assert.equal(an.status, 200)
    assert.ok(an.body.totals.users >= 6)
    const ab = await req('GET', '/admin/bookings', { token: admin.token })
    assert.ok(Array.isArray(ab.body.bookings))

    // all reviews endpoint (admin moderation view)
    const allrev = await req('GET', '/reviews/teacher/all', { token: admin.token })
    assert.ok(allrev.body.reviews.length > 0)

    // student-owned delete (cancel pending own booking)
    const cancSlot = new Date(Date.now() + 80 * 24 * 3600 * 1000).toISOString()
    const cbooking = await req('POST', '/bookings', { token: s.token, body: { teacherId: michaelId, subject: 'Programming', mode: 'online', datetime: cancSlot, price: 750 } })
    const del = await req('DELETE', `/students/me/bookings/${cbooking.body.booking.id}`, { token: s.token })
    assert.equal(del.status, 200)
  })
})