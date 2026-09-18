import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { save, api } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('admin@tutorconnect.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { token, user } = await api('/auth/login', 'POST', { email, password })
      save(user, token)
      if (user.role === 'student') nav('/student')
      else if (user.role === 'teacher') nav('/teacher')
      else nav('/admin')
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="container">
      <div className="card p-6 md:p-8 max-w-md mx-auto animate-fade-up">
        <h1 className="text-2xl font-bold text-center mb-1 dark:text-dark-heading">Welcome Back</h1>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-6">Login to access your dashboard.</p>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm mb-4">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="label mb-1">Email</label>
            <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div className="mb-6">
            <label className="label mb-1">Password</label>
            <input type="password" className="input" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <button disabled={loading} className="btn w-full text-base py-2.5">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <p className="text-center text-sm mt-6">
          Don't have an account? <Link to="/register" className="font-semibold text-primary-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}
