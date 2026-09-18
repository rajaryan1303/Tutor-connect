import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { Star, Calendar, IndianRupee, Users, Clock, TrendingUp, Award, CreditCard } from 'lucide-react'

export default function TeacherDashboard() {
  const { api, user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [reviews, setReviews] = useState([])
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState({ totalEarnings: 0, completedSessions: 0, avgRating: 0 })

  async function load() {
    try {
      const p = await api('/teachers/me')
      setProfile(p.profile)
      const b = await api('/teachers/bookings')
      setBookings(b.bookings)
      const r = await api(`/reviews/teacher/${user.id}`)
      setReviews(r.reviews)
      
      // Calculate stats
      const completed = b.bookings.filter(booking => booking.status === 'completed')
      const totalEarnings = completed.reduce((sum, booking) => sum + booking.price, 0)
      const avgRating = r.reviews.length > 0 ? r.reviews.reduce((sum, review) => sum + review.rating, 0) / r.reviews.length : 0
      
      setStats({
        totalEarnings,
        completedSessions: completed.length,
        avgRating
      })
    } catch (e) {
      console.error('Failed to load data:', e)
    }
    try {
      const pm = await api('/teachers/me/payments')
      setPayments(pm.payments || [])
    } catch (e) {
      console.error('Failed to load payments:', e)
    }
  }

  useEffect(() => { load() }, [user.id])

  async function updateProfile() {
    try {
      await api('/teachers/me', 'PUT', profile)
      await load()
    } catch (e) {
      console.error('Failed to update profile:', e)
    }
  }

  async function act(id, action) {
    try {
      await api(`/teachers/bookings/${id}/${action}`, 'POST')
      await load()
    } catch (e) {
      console.error('Failed to update booking:', e)
    }
  }

  async function complete(id) {
    try {
      await api(`/bookings/${id}/complete`, 'POST')
      await load()
    } catch (e) {
      console.error('Failed to complete booking:', e)
    }
  }

  function renderStars(rating) {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={16} className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
    ))
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const acceptedBookings = bookings.filter(b => b.status === 'accepted')
  const completedBookings = bookings.filter(b => b.status === 'completed')

  return (
    <div className="container">
      <h1 className="page-title">Teacher Dashboard</h1>
      
      {!user?.approved && (
        <div className="card p-4 mb-6 bg-amber-50 border-amber-200 text-amber-800">
          <div className="flex items-center gap-2">
            <Clock size={20} />
            <span className="font-medium">Account Pending Approval</span>
          </div>
          <p className="mt-1 text-sm">Your teacher account is under review. You'll be notified once approved.</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8 stagger">
        <div className="card p-6 text-center" style={{ animationDelay: '50ms' }}>
          <IndianRupee className="mx-auto mb-2 text-green-600" size={32} />
          <div className="text-2xl font-bold dark:text-dark-heading">₹{stats.totalEarnings}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Earnings</div>
        </div>
        <div className="card p-6 text-center" style={{ animationDelay: '100ms' }}>
          <Users className="mx-auto mb-2 text-blue-600" size={32} />
          <div className="text-2xl font-bold dark:text-dark-heading">{stats.completedSessions}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Completed Sessions</div>
        </div>
        <div className="card p-6 text-center" style={{ animationDelay: '150ms' }}>
          <Award className="mx-auto mb-2 text-yellow-600" size={32} />
          <div className="text-2xl font-bold dark:text-dark-heading">{stats.avgRating.toFixed(1)}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Average Rating</div>
        </div>
        <div className="card p-6 text-center" style={{ animationDelay: '200ms' }}>
          <TrendingUp className="mx-auto mb-2 text-purple-600" size={32} />
          <div className="text-2xl font-bold dark:text-dark-heading">{reviews.length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Reviews</div>
        </div>
      </div>

      {/* Profile Management */}
      {profile && (
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Profile Settings</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Subjects (comma-separated)</label>
              <input 
                className="input" 
                value={profile.subjects?.join(', ') || ''} 
                onChange={e=>setProfile({...profile, subjects: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} 
                placeholder="Mathematics, Physics, Chemistry"
              />
            </div>
            <div>
              <label className="label">Years of Experience</label>
              <input 
                className="input" 
                type="number"
                value={profile.experience} 
                onChange={e=>setProfile({...profile, experience: Number(e.target.value||0)})} 
              />
            </div>
            <div>
              <label className="label">Available Timings</label>
              <input 
                className="input" 
                value={profile.timings?.join(', ') || ''} 
                onChange={e=>setProfile({...profile, timings: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} 
                placeholder="Morning, Afternoon, Evening"
              />
            </div>
            <div>
              <label className="label">Hourly Rate (₹/hr)</label>
              <input 
                className="input" 
                type="number"
                value={profile.rate} 
                onChange={e=>setProfile({...profile, rate: Number(e.target.value||0)})} 
              />
            </div>
            <div>
              <label className="label">Teaching Mode</label>
              <select className="input" value={profile.mode} onChange={e=>setProfile({...profile, mode: e.target.value})}>
                <option value="online">Online Only</option>
                <option value="offline">Offline Only</option>
                <option value="both">Both Online & Offline</option>
              </select>
            </div>
            <div>
              <label className="label">Service Areas (for offline)</label>
              <input 
                className="input" 
                value={profile.areas?.join(', ') || ''} 
                onChange={e=>setProfile({...profile, areas: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} 
                placeholder="Andheri, Indiranagar, Koramangala"
              />
            </div>
          </div>
          <button className="btn mt-4" onClick={updateProfile}>Save Profile</button>
        </div>
      )}

      {/* Pending Requests */}
      {pendingBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Pending Requests</h2>
          <div className="grid gap-4">
            {pendingBookings.map(b => (
              <div key={b.id} className="card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold dark:text-dark-heading">{b.subject}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Student: {b.studentName || b.studentId}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                      <span>₹{b.price}</span>
                      <span>{b.mode}</span>
                      <span>{new Date(b.datetime).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn text-sm" onClick={() => act(b.id,'accept')}>Accept</button>
                    <button className="btn btn-secondary text-sm" onClick={() => act(b.id,'reject')}>Decline</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Sessions */}
      {acceptedBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Upcoming Sessions</h2>
          <div className="grid gap-4">
            {acceptedBookings.map(b => (
              <div key={b.id} className="card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold dark:text-dark-heading">{b.subject}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Student: {b.studentName || b.studentId}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        Accepted
                      </span>
                      <span>₹{b.price}</span>
                      <span>{b.mode}</span>
                      <span>{new Date(b.datetime).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="btn text-sm" onClick={() => complete(b.id)}>
                    Mark Completed
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Recent Reviews</h2>
          <div className="grid gap-4">
            {reviews.slice(0, 5).map(review => (
              <div key={review.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        by {review.studentName || review.studentId}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{review.comment}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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
                  <CreditCard size={20} className="text-green-600" />
                  <div>
                    <p className="font-medium dark:text-dark-heading">
                      {p.subject || 'Session'} — {p.studentName || 'Student'}
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

      {/* Completed Sessions History */}
      {completedBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Session History</h2>
          <div className="grid gap-4">
            {completedBookings.slice(0, 10).map(b => (
              <div key={b.id} className="card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold dark:text-dark-heading">{b.subject}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Student: {b.studentName || b.studentId}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Completed
                      </span>
                      <span>₹{b.price}</span>
                      <span>{b.mode}</span>
                      <span>{new Date(b.datetime).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
