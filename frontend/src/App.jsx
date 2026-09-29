import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'

import Login from './pages/Login'
import Register from './pages/Register'

import Services from './pages/Services'
import About from './pages/About'
import Membership from './pages/Membership'
import Contact from './pages/Contact'

import Dashboard from './pages/Dashboard'
import Workout from './pages/Workout'
import AIPlan from './pages/AIPlan'
import Progress from './pages/Progress'
import Goals from './pages/Goals'
import Nutrition from './pages/Nutrition'
import Assistant from './pages/Assistant'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import { api } from './api/client'

function RootRedirect() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let active = true

    async function verifySession() {
      const token = localStorage.getItem('fitzone_access_token')

      if (!token) {
        if (active) setStatus('unauthenticated')
        return
      }

      try {
        await api.get('/api/auth/session')
        if (active) setStatus('authenticated')
      } catch {
        if (active) setStatus('unauthenticated')
      }
    }

    verifySession()

    return () => {
      active = false
    }
  }, [])

  if (status === 'checking') {
    return (
      <main className="auth-page" aria-live="polite">
        <section
          className="auth-card"
          style={{ maxWidth: '520px', margin: '10vh auto' }}
        >
          <p className="eyebrow">SECURE SESSION</p>
          <h1>Checking your session.</h1>
          <p className="auth-card-header-text">
            FitZone AI is verifying your authentication.
          </p>
        </section>
      </main>
    )
  }

  return (
    <Navigate
      to={status === 'authenticated' ? '/dashboard' : '/login'}
      replace
    />
  )
}

function AppShell() {
  const location = useLocation()
  const isAppRoute = [
    '/dashboard',
    '/workout',
    '/ai-plan',
    '/progress',
    '/goals',
    '/nutrition',
    '/assistant',
    '/profile',
    '/admin',
  ].some(
    (path) =>
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
  )

  return (
    <div className="app">
      <ScrollToTop />
      {!isAppRoute && <Navbar />}

      <Routes>
        {/* Root authentication redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public pages */}
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/contact" element={<Contact />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard application */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workout" element={<Workout />} />
            <Route path="/ai-plan" element={<AIPlan />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
      </Routes>

      {!isAppRoute && <Footer />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App