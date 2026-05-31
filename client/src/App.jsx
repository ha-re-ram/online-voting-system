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

function RequireAdmin({ children }){
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  if(!token) return <Navigate to="/login" replace />
  if(user?.role !== 'admin') return <Navigate to="/dashboard" replace />
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
        <Route path="/results" element={<ResultsPage/>} />
        {/* support direct links like /results/123 from Dashboard */}
        <Route path="/results/:id" element={<ResultsPage/>} />
        <Route path="/admin" element={<RequireAdmin><AdminPage/></RequireAdmin>} />
      </Routes>
    </div>
  )
}
