import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user')||'null')
  const [elections, setElections] = useState([])
  const [candidates, setCandidates] = useState([])
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)
      const [electionsRes, votesRes] = await Promise.all([
        api.get('/elections'),
        api.get('/all-votes')
      ])
      setElections(electionsRes.data)
      setVotes(votesRes.data)
      
      // Load candidates for active elections
      if (electionsRes.data.length > 0) {
        const activeElection = electionsRes.data[0]
        const candidatesRes = await api.get(`/candidates/${activeElection.id}`)
        setCandidates(candidatesRes.data)
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="container">
      <div className="loading-screen">
        <svg className="icon animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <p>Loading dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="dashboard">
      <div className="container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-header">
            <div>
              <h1>Welcome back, {user?.name || user?.email}</h1>
              <p className="text-muted">Here's what's happening with the elections</p>
            </div>
            {user?.role === 'admin' && (
              <Link to="/admin" className="button">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                </svg>
                Create Election
              </Link>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{candidates.length}</div>
                <div className="stat-label">Total Candidates</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{votes.length}</div>
                <div className="stat-label">Total Votes Cast</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{elections.length}</div>
                <div className="stat-label">Active Elections</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header">
              <h3>Active Elections</h3>
              <Link to="/vote" className="button secondary small">View All</Link>
            </div>
            {elections.length > 0 ? (
              <div className="election-list">
                {elections.map(election => (
                  <div key={election.id} className="election-item">
                    <div className="election-info">
                      <h4>{election.title}</h4>
                      <p className="text-sm text-muted">{election.description || 'No description provided'}</p>
                    </div>
                    <div className="election-actions">
                      <Link to={`/vote?election=${election.id}`} className="button small">
                        Cast Vote
                      </Link>
                      <Link to={`/results/${election.id}`} className="button secondary small">
                        Results
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd"/>
                </svg>
                <p>No active elections</p>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="button small">Create an Election</Link>
                )}
              </div>
            )}
          </div>

          <div className="dashboard-sidebar">
            {/* Quick Actions */}
            <div className="card">
              <h3>Quick Actions</h3>
              <div className="quick-actions">
                <Link to="/vote" className="action-button">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  Cast Vote
                </Link>
                <Link to="/results" className="action-button">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                  View Results
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="action-button">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                    </svg>
                    Manage Elections
                  </Link>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3>Recent Activity</h3>
              {votes.length > 0 ? (
                <div className="activity-list">
                  {votes.slice(0, 5).map(vote => (
                    <div key={vote.id} className="activity-item">
                      <div className="activity-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <div className="activity-info">
                        <p className="text-sm">Vote cast in election #{vote.election_id}</p>
                        <span className="text-xs text-muted">Just now</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .dashboard {
          min-height: calc(100vh - 64px);
          padding: 2rem 0;
          background: var(--gray-50);
        }

        .welcome-section {
          margin-bottom: 2rem;
        }

        .welcome-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .stat-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon .icon {
          width: 1.5rem;
          height: 1.5rem;
          color: white;
        }

        .stat-icon.blue { background: var(--primary); }
        .stat-icon.green { background: var(--success); }
        .stat-icon.purple { background: #8b5cf6; }

        .stat-info {
          flex: 1;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--gray-900);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--gray-600);
          margin-top: 0.25rem;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem;
          align-items: start;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .election-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .election-item {
          padding: 1rem;
          background: var(--gray-50);
          border-radius: 0.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .election-info {
          flex: 1;
        }

        .election-info h4 {
          margin: 0 0 0.25rem;
        }

        .election-actions {
          display: flex;
          gap: 0.5rem;
        }

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--gray-50);
          border-radius: 0.5rem;
          color: var(--gray-700);
          text-decoration: none;
          transition: all 0.2s;
        }

        .action-button:hover {
          background: var(--gray-100);
          color: var(--gray-900);
        }

        .action-button .icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .activity-icon {
          width: 2rem;
          height: 2rem;
          border-radius: 9999px;
          background: var(--success);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .activity-icon .icon {
          width: 1rem;
          height: 1rem;
          color: white;
        }

        .activity-info p {
          margin: 0;
        }

        .empty-state {
          padding: 3rem;
          text-align: center;
          color: var(--gray-600);
        }

        .empty-state .icon {
          width: 3rem;
          height: 3rem;
          margin-bottom: 1rem;
          color: var(--gray-400);
        }

        .loading-screen {
          padding: 3rem;
          text-align: center;
          color: var(--gray-600);
        }

        .loading-screen .icon {
          width: 3rem;
          height: 3rem;
          margin-bottom: 1rem;
          color: var(--primary);
        }

        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .election-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .election-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  )
}
