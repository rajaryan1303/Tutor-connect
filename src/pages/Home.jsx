import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { BookOpen, Briefcase, UserCheck } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()

  const dashboardPath = user ? `/${user.role}` : '/login'

  return (
    <div className="container">
      <div className="text-center py-16 animate-fade-up">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white">Find Your Perfect Tutor Today</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300">Connect with expert tutors for personalized learning, or share your knowledge and earn.</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to={dashboardPath} className="btn text-lg px-8 py-3">Get Started</Link>
          {!user && <Link to="/register" className="btn btn-secondary text-lg px-8 py-3">Become a Tutor</Link>}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 py-10 stagger">
        <div className="card p-6 text-center" style={{ animationDelay: '80ms' }}>
          <div className="inline-block p-4 bg-primary-100 dark:bg-primary-900/50 rounded-full mb-4">
            <BookOpen className="text-primary-600 dark:text-primary-300" size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2 dark:text-dark-heading">Expert Tutors</h3>
          <p className="text-slate-600 dark:text-slate-400">Access a wide range of verified tutors specializing in various subjects.</p>
        </div>
        <div className="card p-6 text-center" style={{ animationDelay: '160ms' }}>
          <div className="inline-block p-4 bg-primary-100 dark:bg-primary-900/50 rounded-full mb-4">
            <UserCheck className="text-primary-600 dark:text-primary-300" size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2 dark:text-dark-heading">Flexible Learning</h3>
          <p className="text-slate-600 dark:text-slate-400">Choose between online or offline sessions that fit your schedule.</p>
        </div>
        <div className="card p-6 text-center" style={{ animationDelay: '240ms' }}>
          <div className="inline-block p-4 bg-primary-100 dark:bg-primary-900/50 rounded-full mb-4">
            <Briefcase className="text-primary-600 dark:text-primary-300" size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2 dark:text-dark-heading">Earn With Us</h3>
          <p className="text-slate-600 dark:text-slate-400">Join our platform as a tutor to share your expertise and earn money.</p>
        </div>
      </div>
    </div>
  )
}
