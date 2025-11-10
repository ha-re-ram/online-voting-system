import React, { useEffect, useState } from 'react'
import api from '../api'
import { Link } from 'react-router-dom'

export default function VotePage(){
  const [elections, setElections] = useState([])
  const [candidates, setCandidates] = useState([])
  const [electionId, setElectionId] = useState('')
  const [candidateId, setCandidateId] = useState('')
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(()=>{ loadElections() }, [])

  async function loadElections(){
    try{
      setLoading(true)
      const res = await api.get('/elections')
      setElections(res.data)
      if(res.data[0]) setElectionId(res.data[0].id)
    }catch(e){
      setMsg(e.response?.data?.error || e.message)
    }finally{ setLoading(false) }
  }

  useEffect(()=>{ if(electionId) loadCandidates(electionId) }, [electionId])
  async function loadCandidates(id){
    try{
      setLoading(true)
      const res = await api.get(`/candidates/${id}`)
      setCandidates(res.data)
      setCandidateId(res.data[0]?.id || '')
    }catch(e){
      setMsg(e.response?.data?.error || e.message)
    }finally{ setLoading(false) }
  }

  async function submitVote(){
    if(!electionId) return setMsg('Please select an election')
    if(!candidateId) return setMsg('Please select a candidate')


    try{
      setSubmitting(true)
      const res = await api.post('/vote', { election_id: electionId, candidate_id: candidateId })
      setMsg(res.data.message || 'Your vote was recorded')
      setSubmitted(true)
    } catch(e){
      setMsg(e.response?.data?.error || e.message)
    } finally { setSubmitting(false) }
  }

  return (
    <div className="vote-page">
      <div className="container">
        <div className="page-header">
          <h2>Cast your vote</h2>
          <p className="text-muted">Choose a candidate below and submit your vote.</p>
        </div>

        <div className="vote-grid">
          <div className="card">
            <label htmlFor="election-select">Election</label>
            <select id="election-select" value={electionId} onChange={e=>{ setElectionId(e.target.value); setMsg(null); setSubmitted(false) }}>
              {elections.map(e=> <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>

            <div style={{marginTop:12}}>
              <label>Candidates</label>
              {loading ? (
                <p className="small muted">Loading candidates...</p>
              ) : candidates.length===0 ? (
                <p className="small muted">No candidates found for this election.</p>
              ) : (
                <div className="candidates">
                  {candidates.map(c => (
                    <button
                      key={c.id}
                      className={`candidate-card ${candidateId===c.id ? 'selected' : ''}`}
                      onClick={()=>{ setCandidateId(c.id); setMsg(null) }}
                      aria-pressed={candidateId===c.id}
                      title={c.name}
                    >
                      <div className="candidate-avatar">{c.avatar ? <img src={c.avatar} alt=""/> : <span>{c.name?.charAt(0)}</span>}</div>
                      <div className="candidate-body">
                        <div className="candidate-name">{c.name}</div>
                        {c.party && <div className="text-sm text-muted">{c.party}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{marginTop:16, display:'flex', gap:8, alignItems:'center'}}>
              <button className="button" onClick={submitVote} disabled={submitting || submitted}>
                {submitting ? 'Submitting...' : (submitted ? 'Submitted' : 'Vote')}
              </button>
              <button className="button ghost" onClick={()=>{ setCandidateId(''); setMsg(null); setSubmitted(false) }}>
                Clear
              </button>
              {msg && <div className="msg">{msg}</div>}
            </div>

            {submitted && (
              <div className="post-actions" style={{marginTop:12}}>
                <Link to={`/results/${electionId}`} className="button secondary small">View Results</Link>
              </div>
            )}
          </div>

          <aside className="card sidebar">
            <h3>How this works</h3>
            <p className="small muted">Your vote will be recorded on the server and counted towards the selected candidate. You can view results after voting.</p>
            <hr />
            <h4>Quick links</h4>
            <Link to="/dashboard" className="button ghost small">Back to Dashboard</Link>
            <Link to="/results" className="button ghost small" style={{marginTop:8}}>All Results</Link>
          </aside>
        </div>
      </div>

      <style jsx="true">{`
        .vote-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.25rem; align-items: start; }
        .candidates { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; margin-top: 0.5rem; }
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
          min-width: 200px;
        }
        .candidate-card:hover { 
          background: var(--primary-light);
          border-color: var(--primary);
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
          transform: translateY(-1px);
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
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
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
        .candidate-avatar { width:40px; height:40px; border-radius:8px; background:var(--gray-200); display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .candidate-avatar img { width:100%; height:100%; object-fit:cover; }
        .candidate-name { font-weight:600; }
        .sidebar .button { display:block; width:100%; text-align:left; }
        .msg { margin-left:12px; color: var(--danger); }
        @media (max-width: 768px) { .vote-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}