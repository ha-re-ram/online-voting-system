import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

export default function NavBar(){
  const nav = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user')||'null')
  const [menuOpen, setMenuOpen] = useState(false)
  
  function logout(){ 
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setMenuOpen(false)
    nav('/login') 
  }

  const isActive = path => location.pathname === path ? 'nav-link active' : 'nav-link'
  
  return (
    <>
      <header className="navbar">
        <div className="container nav-container">
          <div className="nav-left">
            <Link to="/dashboard" className="brand" onClick={() => setMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon brand-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"/>
              </svg>
              <span>Online Voting</span>
            </Link>
          </div>
          
          {/* Main Navigation Links */}
          <nav className={`nav-links-container ${menuOpen ? 'open' : ''}`}>
            <Link to="/dashboard" className={isActive('/dashboard')} onClick={() => setMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              <span>Dashboard</span>
            </Link>
            <Link to="/vote" className={isActive('/vote')} onClick={() => setMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>Vote</span>
            </Link>
            <Link to="/results" className={isActive('/results')} onClick={() => setMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
              </svg>
              <span>Results</span>
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className={isActive('/admin')} onClick={() => setMenuOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                </svg>
                <span>Admin</span>
              </Link>
            )}
            {/* Mobile Logout option inside menu */}
            {user && (
              <button onClick={logout} className="nav-link logout-btn-mobile">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>Logout</span>
              </button>
            )}
          </nav>

          {/* Right Actions */}
          <div className="nav-right-actions">
            {user ? (
              <div className="user-profile-nav">
                <div className="avatar">
                  {user.name?.[0] || user.email?.[0]}
                </div>
                <div className="user-info-text">
                  <span className="user-name">{user.name || user.email}</span>
                  <span className="user-role">{user.role}</span>
                </div>
                {/* Desktop Logout button */}
                <button onClick={logout} className="button small secondary logout-btn-desktop">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="button signin-btn">Sign in</Link>
            )}

            {/* Hamburger Button */}
            <button className={`hamburger ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </button>
          </div>
        </div>
      </header>

      <style jsx="true">{`
        .nav-container {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 0.5rem 1.25rem !important;
          width: 100%;
        }

        .brand {
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          text-decoration: none !important;
        }

        .brand-icon {
          width: 1.5rem !important;
          height: 1.5rem !important;
          flex-shrink: 0 !important;
        }

        .nav-left {
          display: flex;
          align-items: center;
        }

        .nav-links-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-right-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-profile-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .user-info-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: white;
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .logout-btn-mobile {
          display: none;
        }

        /* Hamburger Styles */
        .hamburger {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 24px !important;
          height: 18px !important;
          background: transparent !important;
          border: none !important;
          cursor: pointer !important;
          padding: 0 !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          min-width: auto !important;
          min-height: auto !important;
        }

        .hamburger .bar {
          width: 100% !important;
          height: 2px !important;
          background-color: var(--text-secondary) !important;
          transition: all 0.3s ease !important;
          border-radius: 2px !important;
          display: block !important;
        }

        .hamburger.active .bar:nth-child(1) {
          transform: translateY(8px) rotate(45deg) !important;
          background-color: white !important;
        }

        .hamburger.active .bar:nth-child(2) {
          opacity: 0 !important;
        }

        .hamburger.active .bar:nth-child(3) {
          transform: translateY(-8px) rotate(-45deg) !important;
          background-color: white !important;
        }

        /* Responsive Breakpoint (Tablet & Mobile) */
        @media (max-width: 768px) {
          .hamburger {
            display: flex !important;
          }

          .logout-btn-desktop {
            display: none !important;
          }

          .logout-btn-mobile {
            display: flex !important;
            width: 100% !important;
            margin-top: 0.5rem !important;
            color: var(--danger) !important;
            border: 1px solid rgba(239, 68, 68, 0.2) !important;
            background: rgba(239, 68, 68, 0.05) !important;
          }

          .logout-btn-mobile:hover {
            background: rgba(239, 68, 68, 0.15) !important;
            color: white !important;
          }

          .user-info-text {
            display: none !important;
          }

          .nav-links-container {
            display: flex !important;
            position: absolute !important;
            top: 100% !important;
            left: 0 !important;
            right: 0 !important;
            flex-direction: column !important;
            background: rgba(9, 13, 22, 0.98) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            border-bottom: 1px solid var(--surface-border) !important;
            padding: 1.5rem !important;
            gap: 0.75rem !important;
            transform: translateY(-10px) !important;
            opacity: 0 !important;
            pointer-events: none !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            z-index: 9999 !important;
          }

          .nav-links-container.open {
            transform: translateY(0) !important;
            opacity: 1 !important;
            pointer-events: auto !important;
          }

          .nav-link {
            width: 100% !important;
            justify-content: flex-start !important;
          }
        }
      `}</style>
    </>
  )
}
