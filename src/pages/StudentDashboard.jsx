import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { Star, Calendar, Clock, MapPin, Monitor, Users, IndianRupee, CreditCard, Info, GraduationCap } from 'lucide-react'

export default function StudentDashboard() {
  const { api } = useAuth()
  const [teachers, setTeachers] = useState([])
  const [bookings, setBookings] = useState([])
  const [reviews, setReviews] = useState([])
  const [payments, setPayments] = useState([])
  const [detailTeacher, setDetailTeacher] = useState(null)
  const [filters, setFilters] = useState({ subject: '', location: '', mode: '' })
  const [message, setMessage] = useState('')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [bookingTeacher, setBookingTeacher] = useState(null)
  const [bookingForm, setBookingForm] = useState({ datetime: '', mode: 'online' })

  function toLocalInput(d) {
    const p = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
  }

  async function load() {
    try {
      const t = await api(`/students/teachers?subject=${filters.subject}&location=${filters.location}&mode=${filters.mode}`)
      setTeachers(t.teachers)
      const b = await api('/bookings')
      setBookings(b.bookings)
    } catch (e) {
      console.error('Failed to load data:', e)
    }
    try {
      const r = await api('/reviews/me')
      setReviews(r.reviews || [])
    } catch (e) {
      console.error('Failed to load reviews:', e)
      setReviews(null)
    }
    try {
      const p = await api('/payments/me')
      setPayments(p.payments || [])
    } catch (e) {
      console.error('Failed to load payments:', e)
    }
  }

  useEffect(() => { load() }, [])

  function openBookingModal(teacher) {
    setBookingTeacher(teacher)
    setBookingForm({ datetime: toLocalInput(new Date(Date.now() + 2 * 60 * 60 * 1000)), mode: 'online' })
    setMessage('')
  }

  async function confirmBooking() {
    const teacher = bookingTeacher
    setMessage('')
    const dt = new Date(bookingForm.datetime)
    if (!bookingForm.datetime || Number.isNaN(dt.getTime()) || dt.getTime() <= Date.now()) {
      setMessage('Please choose a session time in the future.')
      return
    }
    const price = teacher?.rate || 50
    const subject = filters.subject || (teacher?.subjects?.[0] || 'General')
    try {
      const { booking } = await api('/bookings', 'POST', {
        teacherId: teacher.id,
        subject,
        mode: bookingForm.mode,
        datetime: dt.toISOString(),
        price,
      })
      await api('/payments/pay', 'POST', { bookingId: booking.id })
      setBookingTeacher(null)
      setMessage('Booked and paid successfully! Awaiting teacher acceptance.')
      await load()
    } catch (e) {
      setMessage('Booking failed: ' + e.message)
    }
  }

  async function submitReview() {
    try {
      await api('/reviews', 'POST', {
        bookingId: selectedBooking.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      })
      setShowReviewModal(false)
      setReviewForm({ rating: 5, comment: '' })
      setMessage('Review submitted successfully!')
      await load()
    } catch (e) {
      setMessage('Failed to submit review: ' + e.message)
      await load()
    }
  }

  function openReviewModal(booking) {
    setSelectedBooking(booking)
    setShowReviewModal(true)
  }

  function teacherName(b) {
    return b.teacherName || teachers.find(x => x.id === b.teacherId)?.name || b.teacherId
  }

  async function cancelBooking(id) {
    setMessage('')
    try {
      await api(`/students/me/bookings/${id}`, 'DELETE')
      setMessage('Booking cancelled.')
      await load()
    } catch (e) {
      setMessage('Failed to cancel booking: ' + e.message)
    }
  }

  function renderStars(rating) {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={16} className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
    ))
  }

  const completedBookings = bookings.filter(b => b.status === 'completed')
  const activeBookings = bookings.filter(b => b.status !== 'completed')
  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const totalSpent = payments
    .filter(p => p.status === 'paid' || p.status === 'released')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  return (
    <div className="container">
      <h1 className="page-title">Student Dashboard</h1>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8 stagger">
        <div className="card p-6 text-center" style={{ animationDelay: '60ms' }}>
          <GraduationCap className="mx-auto mb-2 text-primary-600" size={32} />
          <div className="text-2xl font-bold dark:text-dark-heading">{completedBookings.length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Completed Sessions</div>
        </div>
        <div className="card p-6 text-center" style={{ animationDelay: '120ms' }}>
          <Clock className="mx-auto mb-2 text-yellow-600" size={32} />
          <div className="text-2xl font-bold dark:text-dark-heading">{pendingCount}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Pending Sessions</div>
        </div>
        <div className="card p-6 text-center" style={{ animationDelay: '180ms' }}>
          <IndianRupee className="mx-auto mb-2 text-green-600" size={32} />
          <div className="text-2xl font-bold dark:text-dark-heading">₹{totalSpent}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Spent</div>
        </div>
      </div>
      
      {/* Search Teachers */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Find Teachers</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <input placeholder="Subject" className="input" value={filters.subject} onChange={e=>setFilters({...filters, subject:e.target.value})} />
          <input placeholder="Location" className="input" value={filters.location} onChange={e=>setFilters({...filters, location:e.target.value})} />
          <select className="input" value={filters.mode} onChange={e=>setFilters({...filters, mode:e.target.value})}>
            <option value="">Any Mode</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="both">Both</option>
          </select>
          <button className="btn" onClick={load}>Search</button>
        </div>
      </div>

      {message && (
        <div className={`card p-4 mb-6 ${message.includes('success') ? 'bg-green-50 text-green-700 border-green-200' : message.includes('failed') || message.includes('Failed') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
          {message}
        </div>
      )}

      {/* Available Teachers */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Available Teachers</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map(t => (
            <div key={t.id} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg dark:text-dark-heading">{t.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {renderStars(Math.round(t.ratings?.avg || 0))}
                    <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">
                      {t.ratings?.avg?.toFixed(1) || 'No ratings'} ({t.ratings?.count || 0})
                    </span>
                  </div>
                </div>
                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">₹{t.rate}/hr</span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Users size={16} />
                  <span>{t.subjects?.join(', ') || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar size={16} />
                  <span>{t.experience} years experience</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  {t.mode === 'online' ? <Monitor size={16} /> : t.mode === 'offline' ? <MapPin size={16} /> : <><Monitor size={16} /><MapPin size={16} /></>}
                  <span>{t.mode === 'both' ? 'Online & Offline' : t.mode}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
              <button className="btn btn-secondary flex-1" onClick={() => setDetailTeacher(t)}>
                <Info size={16} className="mr-1" /> View
              </button>
              <button className="btn flex-1" onClick={() => openBookingModal(t)}>
                Book Session
              </button>
            </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Active Bookings</h2>
          <div className="grid gap-4">
            {activeBookings.map(b => (
              <div key={b.id} className="card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold dark:text-dark-heading">{b.subject}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Teacher: {teacherName(b)}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        b.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {b.status}
                      </span>
                      <span>₹{b.price}</span>
                      <span>{b.mode}</span>
                      <span>{new Date(b.datetime).toLocaleString()}</span>
                    </div>
                  </div>
                  {b.status === 'pending' && (
                    <button
                      className="btn btn-secondary text-sm"
                      onClick={() => cancelBooking(b.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Sessions */}
      {completedBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Completed Sessions</h2>
          <div className="grid gap-4">
            {completedBookings.map(b => {
              const hasReview = Array.isArray(reviews) ? reviews.some(r => r.bookingId === b.id) : true
              return (
                <div key={b.id} className="card p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold dark:text-dark-heading">{b.subject}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Teacher: {teacherName(b)}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                        <span>₹{b.price}</span>
                        <span>{b.mode}</span>
                        <span>{new Date(b.datetime).toLocaleString()}</span>
                      </div>
                    </div>
                    {!hasReview && (
                      <button 
                        className="btn btn-secondary text-sm"
                        onClick={() => openReviewModal(b)}
                      >
                        Leave Review
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Payment History</h2>
          <div className="grid gap-3">
            {payments.slice(0, 10).map(p => (
              <div key={p.id} className="card p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <CreditCard size={20} className="text-primary-600" />
                  <div>
                    <p className="font-medium dark:text-dark-heading">
                      {p.subject || 'Session'} — {p.teacherName || 'Teacher'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {p.method} · {new Date(p.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold dark:text-dark-heading">₹{p.amount}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    p.status === 'released' ? 'bg-green-100 text-green-800' :
                    p.status === 'paid' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teacher Detail Modal */}
      {detailTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-pop">
          <div className="card p-6 max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold dark:text-dark-heading">{detailTeacher.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  {renderStars(Math.round(detailTeacher.ratings?.avg || 0))}
                  <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">
                    {detailTeacher.ratings?.avg?.toFixed(1) || 'No ratings'} ({detailTeacher.ratings?.count || 0})
                  </span>
                </div>
              </div>
              <button className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none" onClick={() => setDetailTeacher(null)}>×</button>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="font-medium">Subjects:</span> {detailTeacher.subjects?.join(', ') || 'N/A'}</p>
              <p><span className="font-medium">Experience:</span> {detailTeacher.experience} years</p>
              <p><span className="font-medium">Rate:</span> ₹{detailTeacher.rate}/hr</p>
              <p><span className="font-medium">Mode:</span> {detailTeacher.mode === 'both' ? 'Online & Offline' : detailTeacher.mode}</p>
              {detailTeacher.areas?.length > 0 && (
                <p><span className="font-medium">Areas:</span> {detailTeacher.areas.join(', ')}</p>
              )}
              {detailTeacher.timings?.length > 0 && (
                <p><span className="font-medium">Timings:</span> {detailTeacher.timings.join(', ')}</p>
              )}
              <p><span className="font-medium">Completed Sessions:</span> {detailTeacher.completed || 0}</p>
              <p><span className="font-medium">Bio:</span> {detailTeacher.bio || 'N/A'}</p>
              <p><span className="font-medium">Qualifications:</span> {detailTeacher.qualifications || 'N/A'}</p>
            </div>
            <div className="flex gap-3">
              <button className="btn flex-1" onClick={() => { setDetailTeacher(null); openBookingModal(detailTeacher) }}>
                Book Session
              </button>
              <button className="btn btn-secondary flex-1" onClick={() => setDetailTeacher(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-pop">
          <div className="card p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 dark:text-dark-heading">
              Book a Session with {bookingTeacher.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              ₹{bookingTeacher.rate}/hr — {bookingTeacher.subjects?.join(', ') || 'General'}
            </p>
            <div className="mb-4">
              <label className="label mb-2">Session Time</label>
              <input
                type="datetime-local"
                className="input"
                min={toLocalInput(new Date(Date.now() + 60 * 60 * 1000))}
                value={bookingForm.datetime}
                onChange={e => setBookingForm({ ...bookingForm, datetime: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label className="label mb-2">Mode</label>
              <select
                className="input"
                value={bookingForm.mode}
                onChange={e => setBookingForm({ ...bookingForm, mode: e.target.value })}
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button className="btn flex-1" onClick={confirmBooking}>
                Confirm Booking
              </button>
              <button
                className="btn btn-secondary flex-1"
                onClick={() => setBookingTeacher(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-pop">
          <div className="card p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 dark:text-dark-heading">Leave a Review</h3>
            <div className="mb-4">
              <label className="label mb-2">Rating</label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setReviewForm({...reviewForm, rating: i + 1})}
                    className="p-1"
                  >
                    <Star 
                      size={24} 
                      className={i < reviewForm.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} 
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="label mb-2">Comment</label>
              <textarea
                className="input"
                rows={4}
                value={reviewForm.comment}
                onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                placeholder="Share your experience..."
              />
            </div>
            <div className="flex gap-3">
              <button className="btn flex-1" onClick={submitReview}>
                Submit Review
              </button>
              <button 
                className="btn btn-secondary flex-1" 
                onClick={() => setShowReviewModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
