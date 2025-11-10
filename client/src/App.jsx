import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import VotePage from './pages/VotePage'
import ResultsPage from './pages/ResultsPage'
import AdminPage from './pages/AdminPage'
import NavBar from './components/NavBar'

function RequireAuth({ children }){
  const token = localStorage.getItem('token')
  if(!token) return <Navigate to="/login" replace />
  return children
}

export default function App(){
  return (
    <div>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard/></RequireAuth>} />
        <Route path="/vote" element={<RequireAuth><VotePage/></RequireAuth>} />
  <Route path="/results" element={<RequireAuth><ResultsPage/></RequireAuth>} />
  {/* support direct links like /results/123 from Dashboard */}
  <Route path="/results/:id" element={<RequireAuth><ResultsPage/></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth><AdminPage/></RequireAuth>} />
      </Routes>
    </div>
  )
}
