import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

import Login from './pages/Login'
import Register from './pages/Register'

import Home from './pages/Home'
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

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import DashboardLayout from './components/DashboardLayout'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />

        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/contact" element={<Contact />} />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard application */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workout" element={<Workout />} />
            <Route path="/ai-plan" element={<AIPlan />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>

        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App