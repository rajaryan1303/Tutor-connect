import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { Users, IndianRupee, BookOpen, TrendingUp, UserCheck, UserX, Eye, CreditCard, Star, Trash2, Search } from 'lucide-react'

export default function AdminDashboard() {
  const { api } = useAuth()
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [detailUser, setDetailUser] = useState(null)
  const [detailProfile, setDetailProfile] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  async function load() {
    try {
      const [u, b, p, r, a] = await Promise.all([
        api('/admin/users'),
        api('/bookings'),
        api('/payments/me'),
        api('/reviews/teacher/all'),
        api('/admin/analytics')
      ])
      
      setUsers(u.users)
      setBookings(b.bookings || [])
      setPayments(p.payments || [])
      setReviews(r.reviews || [])
      setStats(a.totals)
    } catch (e) {
      console.error('Failed to load admin data:', e)
    }
  }

  useEffect(() => { load() }, [])

  async function approve(id) {
    try {
      await api(`/admin/teachers/${id}/approve`, 'POST')
      await load()
    } catch (e) {
      console.error('Failed to approve teacher:', e)
    }
  }

  async function releasePayout(bookingId) {
    try {
      await api('/admin/payouts/release', 'POST', { bookingId })
      await load()
    } catch (e) {
      console.error('Failed to release payout:', e)
    }
  }

  async function viewUser(user) {
    setDetailLoading(true)
    setDetailUser(user)
    setDetailProfile(null)
    try {
      if (user.role === 'teacher') {
        const detail = await api(`/admin/teachers/${user.id}`)
        setDetailProfile(detail.profile)
      }
    } catch (e) {
      console.error('Failed to load teacher details:', e)
    } finally {
      setDetailLoading(false)
    }
  }

  async function deleteReview(id) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    setConfirmDeleteId(null)
    try {
      await api(`/reviews/${id}`, 'DELETE')
      await load()
    } catch (e) {
      console.error('Failed to delete review:', e)
    }
  }

  const pendingTeachers = users.filter(u => u.role === 'teacher' && !u.approved)
  const approvedTeachers = users.filter(u => u.role === 'teacher' && u.approved)
  const students = users.filter(u => u.role === 'student')
  const completedBookings = bookings.filter(b => b.status === 'completed')
  const pendingPayouts = payments.filter(p => p.status === 'paid')
  const releasedPayouts = payments.filter(p => p.status === 'released')

  const monthlyRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  const query = search.trim().toLowerCase()
  const filteredUsers = users.filter(u => {
    const matchesFilter =
      userFilter === 'all' ||
      (userFilter === 'teacher' && u.role === 'teacher') ||
      (userFilter === 'student' && u.role === 'student') ||
      (userFilter === 'admin' && u.role === 'admin') ||
      (userFilter === 'pending' && u.role === 'teacher' && !u.approved)
    const matchesSearch =
      !query ||
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.phone?.toLowerCase().includes(query) ||
      u.role?.toLowerCase().includes(query)
    return matchesFilter && matchesSearch
  })

  const payoutsByTeacher = {}
  for (const p of payments) {
    if (p.status !== 'released') continue
    payoutsByTeacher[p.teacherId] = (payoutsByTeacher[p.teacherId] || 0) + Number(p.amount || 0)
  }
  const topTeachers = Object.entries(payoutsByTeacher)
    .map(([id, amount]) => ({
      id,
      amount,
      name: users.find(u => u.id === id)?.name || bookings.find(b => b.teacherId === id)?.teacherName || id,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  return (
    <div className="container">
      <h1 className="page-title">Admin Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 text-center">
          <Users className="mx-auto mb-2 text-blue-600" size={32} />
          <div className="text-2xl font-bold dark:text-dark-heading">{stats?.users || 0}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Users</div>
        </div>
        <div className="card p-6 text-center">
          <BookOpen className="mx-auto mb-2 text-green-600" size={32} />
          <div className="text-2xl font-bold dark:text-dark-heading">{stats?.bookings || 0}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Bookings</div>
        </div>
        <div className="card p-6 text-center">
          <IndianRupee className="mx-auto mb-2 text-purple-600" size={32} />
          <div className="text-2xl font-bold dark:text-dark-heading">₹{monthlyRevenue}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</div>
        </div>
        <div className="card p-6 text-center">
          <Star className="mx-auto mb-2 text-yellow-600" size={32} />
          <div className="text-2xl font-bold dark:text-dark-heading">{avgRating.toFixed(1)}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Avg Rating</div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card p-4">
          <h3 className="font-semibold mb-2 dark:text-dark-heading">User Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Students:</span>
              <span className="font-medium">{students.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Approved Teachers:</span>
              <span className="font-medium">{approvedTeachers.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending Teachers:</span>
              <span className="font-medium text-yellow-600">{pendingTeachers.length}</span>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <h3 className="font-semibold mb-2 dark:text-dark-heading">Booking Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Completed:</span>
              <span className="font-medium text-green-600">{completedBookings.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Active:</span>
              <span className="font-medium">{bookings.filter(b => b.status === 'accepted').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending:</span>
              <span className="font-medium text-yellow-600">{bookings.filter(b => b.status === 'pending').length}</span>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <h3 className="font-semibold mb-2 dark:text-dark-heading">Financial Overview</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Pending Payouts:</span>
              <span className="font-medium text-yellow-600">₹{pendingPayouts.reduce((sum, p) => sum + p.amount, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Released Payouts:</span>
              <span className="font-medium text-green-600">₹{releasedPayouts.reduce((sum, p) => sum + p.amount, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee (10%):</span>
              <span className="font-medium">₹{(monthlyRevenue * 0.1).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card p-1 mb-6">
        <div className="flex gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'bookings', label: 'Bookings', icon: BookOpen },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'reviews', label: 'Reviews', icon: Star }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedTab === tab.id 
                    ? 'bg-primary-600 text-white' 
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === 'users' && (
        <div className="space-y-6">
          {/* Pending Teacher Approvals */}
          {pendingTeachers.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Pending Teacher Approvals</h2>
              <div className="grid gap-4">
                {pendingTeachers.map(teacher => (
                  <div key={teacher.id} className="border rounded-lg p-4 flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold dark:text-dark-heading">{teacher.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{teacher.email}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{teacher.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn text-sm" onClick={() => approve(teacher.id)}>
                        <UserCheck size={16} className="mr-1" />
                        Approve
                      </button>
                      <button className="btn btn-secondary text-sm" onClick={() => viewUser(teacher)}>
                        <Eye size={16} className="mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Users */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">All Users</h2>
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-9"
                  placeholder="Search by name, email, phone or role…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'student', label: 'Students' },
                  { id: 'teacher', label: 'Teachers' },
                  { id: 'admin', label: 'Admins' },
                  { id: 'pending', label: 'Pending' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setUserFilter(f.id)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      userFilter === f.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b">
                      <td className="p-2 font-medium dark:text-dark-heading">{user.name}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-2 text-slate-600 dark:text-slate-400">{user.email}</td>
                      <td className="p-2">
                        {user.role === 'teacher' ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.approved ? 'Approved' : 'Pending'}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        <button className="text-primary-600 hover:text-primary-700 text-sm" onClick={() => viewUser(user)}>
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'bookings' && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Student</th>
                  <th className="text-left p-2">Teacher</th>
                  <th className="text-left p-2">Subject</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 20).map(booking => (
                  <tr key={booking.id} className="border-b">
                    <td className="p-2 font-mono text-xs">{booking.id}</td>
                    <td className="p-2">{booking.studentName || booking.studentId}</td>
                    <td className="p-2">{booking.teacherName || booking.teacherId}</td>
                    <td className="p-2">{booking.subject}</td>
                    <td className="p-2 font-medium">₹{booking.price}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="p-2 text-slate-600 dark:text-slate-400">
                      {new Date(booking.datetime).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'payments' && (
        <div className="space-y-6">
          {/* Pending Payouts */}
          {pendingPayouts.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Pending Teacher Payouts</h2>
              <div className="grid gap-4">
                {pendingPayouts.map(payment => {
                  const booking = bookings.find(b => b.id === payment.bookingId)
                  return (
                    <div key={payment.id} className="border rounded-lg p-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold dark:text-dark-heading">Booking #{payment.bookingId}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Teacher: {booking?.teacherId} | Amount: ₹{payment.amount}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Subject: {booking?.subject} | Payment Method: {payment.method}
                        </p>
                      </div>
                      <button 
                        className="btn text-sm"
                        onClick={() => releasePayout(payment.bookingId)}
                      >
                        Release Payout
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Payment History */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Payment History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Payment ID</th>
                    <th className="text-left p-2">Booking ID</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Method</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Platform Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment.id} className="border-b">
                      <td className="p-2 font-mono text-xs">{payment.id}</td>
                      <td className="p-2 font-mono text-xs">{payment.bookingId}</td>
                      <td className="p-2 font-medium">₹{payment.amount}</td>
                      <td className="p-2">{payment.method}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.status === 'released' ? 'bg-green-100 text-green-800' :
                          payment.status === 'paid' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="p-2 font-medium text-green-600">
                        ₹{(payment.amount * 0.1).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'reviews' && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">
            All Reviews <span className="text-sm font-normal text-slate-500">({reviews.length})</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Moderate content — deleting a review also recomputes the tutor's rating.
          </p>
          <div className="space-y-3">
            {reviews.length === 0 && (
              <p className="text-slate-500 text-sm">No reviews yet.</p>
            )}
            {reviews.map(review => (
              <div key={review.id} className="border rounded-lg p-4 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {review.studentName || review.studentId}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{review.comment}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(review.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteReview(review.id)}
                  className={`btn text-sm ${confirmDeleteId === review.id ? 'bg-red-600 hover:bg-red-700' : 'btn-secondary'}`}
                >
                  {confirmDeleteId === review.id ? (
                    <>
                      <Trash2 size={16} className="mr-1" /> Confirm Delete
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} className="mr-1" /> Delete
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Recent Activity</h2>
            <div className="space-y-3">
              {bookings.slice(0, 5).map(booking => (
                <div key={booking.id} className="flex items-center gap-3 p-2 border rounded">
                  <BookOpen size={16} className="text-blue-600" />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{booking.subject}</span> session booked
                    <div className="text-slate-600 dark:text-slate-400">
                      {booking.studentName || booking.studentId} → {booking.teacherName || booking.teacherId}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(booking.datetime).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Recent Reviews</h2>
            <div className="space-y-3">
              {reviews.slice(0, 5).map(review => (
                <div key={review.id} className="p-3 border rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={12} className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      by {review.studentName || review.studentId}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Teachers by Payout */}
          {topTeachers.length > 0 && (
            <div className="card p-6 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4 dark:text-dark-heading">Top Teachers by Payout</h2>
              <div className="space-y-2">
                {topTeachers.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-3 p-2 border rounded">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold text-white ${
                      i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-600'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <span className="font-medium text-sm dark:text-dark-heading">{t.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">₹{t.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Details Modal */}
      {detailUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-pop">
          <div className="card p-6 max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold dark:text-dark-heading">{detailUser.name}</h2>
              <button
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none"
                onClick={() => setDetailUser(null)}
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="font-medium">Email:</span> {detailUser.email}</p>
              <p><span className="font-medium">Phone:</span> {detailUser.phone || 'N/A'}</p>
              <p><span className="font-medium">Role:</span> {detailUser.role}</p>
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  detailUser.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {detailUser.role === 'teacher' ? (detailUser.approved ? 'Approved' : 'Pending') : 'Active'}
                </span>
              </p>
            </div>

            {detailUser.role === 'teacher' && (
              <div className="border-t pt-4 mb-4">
                <h3 className="font-semibold mb-3 dark:text-dark-heading">Teacher Profile</h3>
                {detailLoading ? (
                  <div className="animate-shimmer h-24 rounded-md bg-slate-200 dark:bg-slate-700" />
                ) : detailProfile ? (
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Subjects:</span> {detailProfile.subjects?.join(', ') || 'N/A'}</p>
                    <p><span className="font-medium">Experience:</span> {detailProfile.experience} years</p>
                    <p><span className="font-medium">Rate:</span> ₹{detailProfile.rate}/hr</p>
                    <p><span className="font-medium">Mode:</span> {detailProfile.mode}</p>
                    <p><span className="font-medium">Areas:</span> {detailProfile.areas?.join(', ') || 'N/A'}</p>
                    <p><span className="font-medium">Timings:</span> {detailProfile.timings?.join(', ') || 'N/A'}</p>
                    <p><span className="font-medium">Rating:</span> {detailProfile.ratings?.avg ? `${detailProfile.ratings.avg} (${detailProfile.ratings.count})` : 'No ratings'}</p>
                    <p><span className="font-medium">Bio:</span> {detailProfile.bio || 'N/A'}</p>
                    <p><span className="font-medium">Qualifications:</span> {detailProfile.qualifications || 'N/A'}</p>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No tutor profile found.</p>
                )}
              </div>
            )}

            <button className="btn w-full" onClick={() => setDetailUser(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
