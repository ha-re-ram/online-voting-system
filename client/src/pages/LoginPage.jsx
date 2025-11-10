import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [registerMode, setRegisterMode] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const nav = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      nav('/dashboard')
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.error || e.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    setMsg(null)
    try {
      setLoading(true)
      if (!email || !email.includes('@')) {
        setMsg({ type: 'error', text: 'Please enter a valid email address' })
        return
      }

      const res = await api.post('/auth/forgot-password', { email: email.trim() })
      setMsg({ type: 'success', text: 'Password reset instructions sent to your email' })
      
      // Removed DEMO behavior: In a real app, the server would send a unique URL to the user's email.
      // Keeping the UI switch for the password reset form.
      setResetMode(true) 
      setResetToken(res.data?.resetToken || 'DEMO_TOKEN') // Keeping state for form visibility only
      
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.error || e.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setMsg(null)
    try {
      setLoading(true)
      if (!newPassword || newPassword.length < 6) {
        setMsg({ type: 'error', text: 'New password must be at least 6 characters' })
        return
      }

      await api.post('/auth/reset-password', { resetToken, newPassword })
      setMsg({ type: 'success', text: 'Password reset successful! You can now login.' })
      setResetMode(false)
      setResetToken('')
      setNewPassword('')
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.error || e.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setMsg(null)
    try {
      setLoading(true)
      if (!name || name.trim().length < 2) {
        setMsg({ type: 'error', text: 'Please enter your full name (at least 2 characters)' })
        return
      }
      if (!email || !email.includes('@')) {
        setMsg({ type: 'error', text: 'Please enter a valid email address' })
        return
      }
      if (!password || password.length < 6) {
        setMsg({ type: 'error', text: 'Password must be at least 6 characters' })
        return
      }

      const res = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
        role: 'voter'
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      nav('/dashboard')
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message
      setMsg({
        type: 'error',
        text: errorMsg === 'SQLITE_CONSTRAINT: UNIQUE constraint failed: users.email'
          ? 'This email is already registered'
          : errorMsg
      })
    } finally {
      setLoading(false)
    }
  }

  const submitHandler = resetMode ? handleResetPassword : registerMode ? handleRegister : handleLogin
  const submitLabel = resetMode ? 'Reset Password' : registerMode ? 'Create Account' : 'Sign In'

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-grid">
          <div className="card auth-form">
            <div className="auth-header">
              <h1>{resetMode ? 'Reset Password' : registerMode ? 'Create Account' : 'Welcome Back'}</h1>
              <p className="text-muted">
                {resetMode
                  ? 'Enter a new password for your account'
                  : registerMode
                  ? 'Create an account to start voting and participating in elections'
                  : 'Sign in to your account to continue'}
              </p>
            </div>

            <form onSubmit={submitHandler}>
              {msg && (
                <div className={`alert ${msg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                  {msg.text}
                </div>
              )}

              {!resetMode && registerMode && (
                <div className="form-group">
                  <label htmlFor="name">Full name</label>
                  <div className="input-group">
                    {/* Replaced emoji with SVG icon */}
                    <span className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                      </svg>
                    </span>
                    <input id="name" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} disabled={loading} />
                  </div>
                </div>
              )}

              {!resetMode && (
                <div className="form-group">
                  <label htmlFor="email">Email address</label>
                  <div className="input-group">
                    {/* Replaced emoji with SVG icon */}
                    <span className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                    </span>
                    <input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                  </div>
                </div>
              )}

              {!resetMode && (
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-group">
                    {/* Replaced emoji with SVG icon */}
                    <span className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                      </svg>
                    </span>
                    <input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                  </div>
                </div>
              )}

              {resetMode && (
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="input-group">
                    {/* Replaced emoji with SVG icon */}
                    <span className="input-icon">
                       <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm-2 5a3 3 0 016 0v2h-6V7z" />
                      </svg>
                    </span>
                    <input id="newPassword" type="password" placeholder="Enter new password (min 6 chars)" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={loading} />
                  </div>
                </div>
              )}

              {/* REMOVED: resetToken display for demo */}

              <div className="auth-actions">
                <button type="submit" className={`button primary ${loading ? 'loading' : ''}`} disabled={loading}>
                  {loading ? 'Please wait...' : submitLabel}
                </button>

                <div className="auth-links">
                  {!resetMode && !registerMode && (
                    <button type="button" className="link-button" onClick={handleForgotPassword} disabled={loading}>Forgot your password?</button>
                  )}

                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setMsg(null)
                      if (resetMode) {
                        setResetMode(false)
                        setResetToken('')
                        setNewPassword('')
                      } else {
                        setRegisterMode(!registerMode)
                      }
                    }}
                    disabled={loading}
                  >
                    {resetMode ? 'Back to Login' : registerMode ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="auth-info card">
            <div className="auth-info-header">
              <h3>Why sign in?</h3>
            </div>
            <div className="feature-list">
              <div className="feature-item">
                <h4>Vote Securely</h4>
                <p>Cast your vote with confidence in a secure environment</p>
              </div>
              <div className="feature-item">
                <h4>Track Results</h4>
                <p>Monitor election results in real-time</p>
              </div>
              <div className="feature-item">
                <h4>Admin Controls</h4>
                <p>Manage elections and candidates with admin privileges</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-page { min-height: 100vh; padding: 2rem 0; background: var(--gray-50); }
        .auth-grid { display: grid; gap: 2rem; grid-template-columns: 1fr 360px; align-items: start; }
        .auth-form { padding: 2rem; }
        .auth-header { text-align: center; margin-bottom: 1.5rem; }
        .form-group { margin-bottom: 1rem; }
        .input-group { position: relative; }
        .input-icon { 
            position: absolute; 
            left: 0.75rem; 
            top: 50%; 
            transform: translateY(-50%); 
            display: flex;
            align-items: center;
            color: var(--gray-600);
        }
        .input-icon .icon { width: 1.25rem; height: 1.25rem; }
        .input-group input { padding-left: 2.5rem; width: 100%; }
        .auth-actions { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .auth-links { display:flex; gap:0.5rem; justify-content: space-between; align-items:center; }
        .auth-info { background: linear-gradient(to bottom right, #5b9df9, #2b6cff); color: white; padding: 1.5rem; border-radius: 4px; }
        .feature-list { display:flex; flex-direction:column; gap:0.75rem; }
        @media (max-width: 1024px) { .auth-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}