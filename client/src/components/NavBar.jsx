import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

export default function NavBar(){
  const nav = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user')||'null')
  
  function logout(){ 
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    nav('/login') 
  }

  const isActive = path => location.pathname === path ? 'nav-link active' : 'nav-link'
  
  return (
    <>
      <header className="navbar">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="brand">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"/>
              </svg>
              <span>Online Voting</span>
            </Link>
          </div>
          
          <nav className="flex items-center gap-1">
            <Link to="/dashboard" className={isActive('/dashboard')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              Dashboard
            </Link>
            <Link to="/vote" className={isActive('/vote')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Vote
            </Link>
            <Link to="/results" className={isActive('/results')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
              </svg>
              Results
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className={isActive('/admin')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                </svg>
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="avatar">
                    {user.name?.[0] || user.email?.[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name || user.email}</span>
                    <span className="text-xs text-muted">{user.role}</span>
                  </div>
                </div>
                <button onClick={logout} className="small secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="button">Sign in</Link>
            )}
          </div>
        </div>
      </header>

      <style jsx="true">{`
        .navbar {
          background: white;
          border-bottom: 1px solid var(--gray-200);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--gray-900);
          text-decoration: none;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          color: var(--gray-600);
          border-radius: 0.375rem;
          text-decoration: none;
          transition: all 0.2s;
        }

        .nav-link:hover {
          color: var(--gray-900);
          background: var(--gray-50);
        }

        .nav-link.active {
          color: var(--primary);
          background: var(--gray-50);
        }

        .icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .avatar {
          width: 2rem;
          height: 2rem;
          border-radius: 9999px;
          background: var(--primary);
          color: white;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          text-transform: uppercase;
        }
      `}</style>
    </>
  )
}
