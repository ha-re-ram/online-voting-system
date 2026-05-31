import React, { useEffect, useState } from 'react'
import api from '../api'
import { Link } from 'react-router-dom'

export default function VotePage(){
  const [elections, setElections] = useState([])
  const [candidates, setCandidates] = useState([])
  const [myVotes, setMyVotes] = useState([])
  const [electionId, setElectionId] = useState('')
  const [candidateId, setCandidateId] = useState('')
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Track the status of the selected election
  const currentElection = elections.find(e => String(e.id) === String(electionId))
  const now = new Date()
  const hasStarted = currentElection ? (!currentElection.start_date || new Date(currentElection.start_date) <= now) : false
  const hasEnded = currentElection ? (currentElection.end_date && new Date(currentElection.end_date) < now) : false
  const isVoted = currentElection ? myVotes.includes(Number(currentElection.id)) : false
  const canVote = hasStarted && !hasEnded && !isVoted

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [electionsRes, votesRes] = await Promise.all([
        api.get('/elections'),
        api.get('/my-votes')
      ])
      setElections(electionsRes.data)
      setMyVotes(votesRes.data.map(Number))
      if (electionsRes.data[0]) setElectionId(electionsRes.data[0].id)
    } catch (e) {
      setMsg(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (electionId) {
      loadCandidates(electionId)
      setSubmitted(myVotes.includes(Number(electionId)))
      setCandidateId('')
      setMsg(null)
    }
  }, [electionId, myVotes])

  async function loadCandidates(id) {
    try {
      const res = await api.get(`/candidates/${id}`)
      setCandidates(res.data)
    } catch (e) {
      setMsg(e.response?.data?.error || e.message)
    }
  }

  async function submitVote() {
    if (!electionId) return setMsg('Please select an election')
    if (!candidateId) return setMsg('Please select a candidate')

    try {
      setSubmitting(true)
      const res = await api.post('/vote', { election_id: Number(electionId), candidate_id: Number(candidateId) })
      
      // Update local voted list immediately
      setMyVotes(prev => [...prev, Number(electionId)])
      setSubmitted(true)
      setMsg(res.data.message || 'Your vote was recorded!')
    } catch (e) {
      setMsg(e.response?.data?.error || e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getElectionStatusText = (e) => {
    const eNow = new Date()
    const eStarted = !e.start_date || new Date(e.start_date) <= eNow
    const eEnded = e.end_date && new Date(e.end_date) < eNow
    const eVoted = myVotes.includes(Number(e.id))

    if (eVoted) return 'Voted'
    if (eEnded) return 'Ended'
    if (!eStarted) return 'Not Started'
    return 'Active'
  }

  const getElectionStatusClass = (e) => {
    const status = getElectionStatusText(e)
    if (status === 'Voted') return 'status-badge voted'
    if (status === 'Ended') return 'status-badge ended'
    if (status === 'Not Started') return 'status-badge upcoming'
    return 'status-badge active'
  }

  return (
    <div className="vote-page">
      <div className="container">
        <div className="page-header">
          <h2>Cast your vote</h2>
          <p className="text-muted">Choose a candidate below and submit your vote securely.</p>
        </div>

        <div className="vote-grid">
          <div className="card">
            <label htmlFor="election-select">Election</label>
            <select id="election-select" value={electionId} onChange={e => { setElectionId(e.target.value) }}>
              {elections.map(e => (
                <option key={e.id} value={e.id}>
                  {e.title} ({getElectionStatusText(e)})
                </option>
              ))}
            </select>

            {currentElection && (
              <div className="election-dates-info" style={{ marginTop: 8, fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                {currentElection.start_date && (
                  <span><strong>Starts:</strong> {new Date(currentElection.start_date).toLocaleString()} </span>
                )}
                {currentElection.end_date && (
                  <span style={{ marginLeft: 16 }}><strong>Ends:</strong> {new Date(currentElection.end_date).toLocaleString()}</span>
                )}
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <label>Candidates</label>

              {/* Status Message Banners */}
              {isVoted && (
                <div className="status-banner info">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>You have already cast your vote in this election. Thank you for participating!</span>
                </div>
              )}

              {hasEnded && (
                <div className="status-banner error">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>This election has ended. Voting is no longer active.</span>
                </div>
              )}

              {!isVoted && currentElection && !hasStarted && (
                <div className="status-banner warning">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>This election has not started yet. Please check back later.</span>
                </div>
              )}

              {loading ? (
                <p className="small muted">Loading candidates...</p>
              ) : candidates.length === 0 ? (
                <p className="small muted">No candidates found for this election.</p>
              ) : (
                <div className="candidates">
                  {candidates.map(c => (
                    <button
                      key={c.id}
                      className={`candidate-card ${candidateId === c.id ? 'selected' : ''} ${!canVote ? 'disabled-card' : ''}`}
                      onClick={() => { if (canVote) { setCandidateId(c.id); setMsg(null) } }}
                      disabled={!canVote}
                      aria-pressed={candidateId === c.id}
                      title={c.name}
                    >
                      <div className="candidate-avatar">
                        {c.avatar ? <img src={c.avatar} alt="" /> : <span>{c.name?.charAt(0)}</span>}
                      </div>
                      <div className="candidate-body">
                        <div className="candidate-name">{c.name}</div>
                        {c.party && <div className="text-sm text-muted">{c.party}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="button" onClick={submitVote} disabled={submitting || !canVote || !candidateId}>
                {submitting ? 'Submitting...' : (isVoted ? 'Voted' : 'Cast Vote')}
              </button>
              {canVote && (
                <button className="button ghost" onClick={() => { setCandidateId(''); setMsg(null) }}>
                  Clear
                </button>
              )}
              {msg && (
                <div className={`msg ${msg.includes('recorded') || msg.includes('successfully') ? 'success-msg' : 'error-msg'}`}>
                  {msg}
                </div>
              )}
            </div>

            {(isVoted || hasEnded) && (
              <div className="post-actions" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--gray-200)' }}>
                <Link to={`/results/${electionId}`} className="button secondary">View Live Results</Link>
              </div>
            )}
          </div>

          <aside className="card sidebar">
            <h3>Election List</h3>
            <div className="election-mini-list">
              {elections.map(e => (
                <button
                  key={e.id}
                  className={`mini-item ${String(e.id) === String(electionId) ? 'active' : ''}`}
                  onClick={() => { setElectionId(e.id) }}
                >
                  <span className="mini-title">{e.title}</span>
                  <span className={getElectionStatusClass(e)}>{getElectionStatusText(e)}</span>
                </button>
              ))}
            </div>
            <hr />
            <h4>Quick links</h4>
            <Link to="/dashboard" className="button ghost small">Back to Dashboard</Link>
            <Link to="/results" className="button ghost small" style={{ marginTop: 8 }}>All Results</Link>
          </aside>
        </div>
      </div>

      <style jsx="true">{`
        .vote-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.25rem; align-items: start; }
        .candidates { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-top: 0.5rem; }
        .candidate-card { 
          display: flex; 
          gap: 0.75rem; 
          align-items: center; 
          padding: 0.75rem; 
          background: white; 
          border: 1px solid var(--gray-200); 
          cursor: pointer; 
          text-align: left; 
          transition: all 0.2s ease;
          border-radius: 8px;
          min-width: 200px;
        }
        .candidate-card:hover:not(:disabled) { 
          background: var(--primary-light);
          border-color: var(--primary);
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.1);
          transform: translateY(-2px);
          color: var(--gray-900);
        }
        .candidate-card:focus { 
          outline: none; 
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
        }
        .candidate-card.selected { 
          background: var(--primary); 
          border-color: var(--primary);
          color: white;
          box-shadow: 0 4px 8px rgba(37, 99, 235, 0.2);
        }
        .candidate-card.selected .text-muted,
        .candidate-card.selected .candidate-name { 
          color: rgba(255,255,255,0.9); 
          opacity: 1;
        }
        .candidate-avatar {
          background: var(--gray-100);
          color: var(--primary);
        }
        .candidate-card.selected .candidate-avatar {
          background: rgba(255,255,255,0.2);
          color: white;
        }
        .candidate-avatar { width:40px; height:40px; border-radius:8px; background:var(--gray-200); display:flex; align-items:center; justify-content:center; overflow:hidden; font-weight:600; }
        .candidate-avatar img { width:100%; height:100%; object-fit:cover; }
        .candidate-name { font-weight:600; }
        .sidebar .button { display:block; width:100%; text-align:left; }
        
        /* Banners */
        .status-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1.25rem;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .status-banner svg { width: 1.25rem; height: 1.25rem; flex-shrink: 0; }
        .status-banner.info { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
        .status-banner.error { background: #fef2f2; color: #991b1b; border: 1px solid #fca5a5; }
        .status-banner.warning { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }

        /* Badges */
        .status-badge {
          display: inline-block;
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-weight: 600;
        }
        .status-badge.active { background: #dcfce7; color: #166534; }
        .status-badge.ended { background: #f3f4f6; color: #374151; }
        .status-badge.voted { background: #dbeafe; color: #1e40af; }
        .status-badge.upcoming { background: #fef3c7; color: #92400e; }

        /* Mini list */
        .election-mini-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin: 0.75rem 0;
        }
        .mini-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 0.75rem;
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: 8px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mini-item:hover {
          background: var(--gray-100);
          border-color: var(--gray-300);
        }
        .mini-item.active {
          background: #eff6ff;
          border-color: var(--primary);
        }
        .mini-title { font-weight: 500; font-size: 0.875rem; color: var(--gray-900); }

        .disabled-card {
          opacity: 0.65;
          cursor: not-allowed;
        }

        /* Message handling */
        .msg { margin-left: 12px; font-weight: 500; font-size: 0.875rem; }
        .success-msg { color: #166534; }
        .error-msg { color: var(--danger); }

        @media (max-width: 768px) { .vote-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}