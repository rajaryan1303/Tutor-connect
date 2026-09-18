import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
import { Sun, Moon, LogOut, User, LayoutDashboard } from 'lucide-react'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import TeacherDashboard from './pages/TeacherDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

function Protected({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (role && user.role !== role) return <Navigate to="/" />
  if (role === 'teacher' && user.role === 'teacher' && !user.approved) {
    return (
      <div className="container mt-10">
        <div className="card p-6 text-center">
          <h2 className="text-xl font-semibold mb-2 dark:text-dark-heading">Awaiting Approval</h2>
          <p className="text-slate-600 dark:text-slate-400">Your teacher account is pending admin approval. Please check back later.</p>
          <Link className="btn mt-4" to="/">Back to Home</Link>
        </div>
      </div>
    )
  }
  return children
}

function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const dashboardPath = user ? `/${user.role}` : '/'

  return (
    <nav className="bg-white border-b dark:bg-dark-card dark:border-dark-border sticky top-0 z-10 animate-fade-down">
      <div className="container py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">TutorConnect</Link>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          {!user ? (
            <>
              <Link to="/login" className="btn">Login</Link>
              <Link to="/register" className="btn btn-secondary">Register</Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to={dashboardPath} className="flex items-center gap-2 text-sm font-medium hover:text-primary-600 dark:hover:text-primary-400">
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <div className="flex items-center gap-2">
                <User size={18} />
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <button onClick={logout} className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700">
                <LogOut size={18} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Navbar />
        <main className="py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/student" element={<Protected role="student"><StudentDashboard /></Protected>} />
            <Route path="/teacher" element={<Protected role="teacher"><TeacherDashboard /></Protected>} />
            <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </AuthProvider>
    </ThemeProvider>
  )
}
