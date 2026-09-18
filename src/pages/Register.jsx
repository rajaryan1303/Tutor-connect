import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const { save, api } = useAuth()
  const nav = useNavigate()
  const [role, setRole] = useState('student')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { token, user } = await api('/auth/register', 'POST', { role, name, email, phone, password })
      save(user, token)
      if (user.role === 'student') nav('/student')
      else nav('/teacher')
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="container py-10">
      <form onSubmit={onSubmit} className="card p-6 max-w-lg mx-auto animate-fade-up">
        <h1 className="text-xl font-semibold mb-4">Create Account</h1>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <label className="label">I am a</label>
        <select className="input mb-3" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        <label className="label">Name</label>
        <input className="input mb-3" value={name} onChange={e=>setName(e.target.value)} />
        <label className="label">Email</label>
        <input className="input mb-3" value={email} onChange={e=>setEmail(e.target.value)} />
        <label className="label">Phone</label>
        <input className="input mb-3" value={phone} onChange={e=>setPhone(e.target.value)} />
        <label className="label">Password</label>
        <input type="password" className="input mb-4" value={password} onChange={e=>setPassword(e.target.value)} />
        <button disabled={loading} className="btn w-full">{loading ? 'Creating...' : 'Register'}</button>
      </form>
    </div>
  )
}
