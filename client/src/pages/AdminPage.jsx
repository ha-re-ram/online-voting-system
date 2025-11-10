import React, { useEffect, useState } from 'react'
import api from '../api'

export default function AdminPage(){
  const [elections, setElections] = useState([])
  const [candidates, setCandidates] = useState([])
  const [users, setUsers] = useState([])
  const [title, setTitle] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [selectedElection, setSelectedElection] = useState('')
  const [msg, setMsg] = useState(null)

  useEffect(()=>{ 
    loadElections()
    loadUsers()
  }, [])

  useEffect(() => {
    if (selectedElection) loadCandidates(selectedElection)
  }, [selectedElection])

  async function loadElections(){
    try {
      const res = await api.get('/elections')
      setElections(res.data)
      if(res.data[0]) setSelectedElection(res.data[0].id)
    } catch(e){ setMsg(e.response?.data?.error || e.message) }
  }

  async function loadCandidates(electionId){
    try {
      const res = await api.get(`/candidates/${electionId}`)
      setCandidates(res.data)
    } catch(e){ setMsg(e.response?.data?.error || e.message) }
  }

  async function loadUsers(){
    try {
      const res = await api.get('/users')
      setUsers(res.data)
    } catch(e){ setMsg(e.response?.data?.error || e.message) }
  }

  async function createElection(){
    try{
      const res = await api.post('/elections/create', { title, description: '' })
      setMsg(res.data.message || 'Created')
      setTitle('')
      loadElections()
    } catch(e){ setMsg(e.response?.data?.error || e.message) }
  }

  async function addCandidate(){
    try{
      const res = await api.post('/candidates/add', { election_id: selectedElection, name: candidateName })
      setMsg(res.data.message || 'Added')
      setCandidateName('')
      loadCandidates(selectedElection)
    } catch(e){ setMsg(e.response?.data?.error || e.message) }
  }

  async function deleteElection(id){
    if(!window.confirm('Delete this election? This will also delete all its candidates and votes.')) return
    try {
      await api.delete(`/election/${id}`)
      setMsg('Election deleted')
      loadElections()
    } catch(e){ setMsg(e.response?.data?.error || e.message) }
  }

  async function deleteCandidate(id){
    if(!window.confirm('Delete this candidate? This will also delete all votes for them.')) return
    try {
      await api.delete(`/candidate/${id}`)
      setMsg('Candidate deleted')
      loadCandidates(selectedElection)
    } catch(e){ setMsg(e.response?.data?.error || e.message) }
  }

  async function deleteUser(id){
    if(!window.confirm('Delete this user? This will also delete all their votes.')) return
    try {
      await api.delete(`/user/${id}`)
      setMsg('User deleted')
      loadUsers()
    } catch(e){ setMsg(e.response?.data?.error || e.message) }
  }

  async function changeRole(id, newRole){
    try {
      await api.post(`/make-${newRole}`, { id })
      setMsg(`User role changed to ${newRole}`)
      loadUsers()
    } catch(e){ setMsg(e.response?.data?.error || e.message) }
  }

  const [tab, setTab] = useState('elections')
  
  return (
    <div className="admin-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h2>Admin Panel</h2>
            <p className="text-muted">Manage elections, candidates, and user roles</p>
          </div>
        </div>

        <div className="tabs">
          <button 
            className={`tab-button ${tab === 'elections' ? 'active' : ''}`}
            onClick={() => setTab('elections')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            Elections & Candidates
          </button>
          <button 
            className={`tab-button ${tab === 'users' ? 'active' : ''}`}
            onClick={() => setTab('users')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
            Users & Roles
          </button>
        </div>

        {tab === 'elections' ? (
          <div className="admin-grid">
            <div className="main-content">
              <div className="card">
                <div className="card-header">
                  <h3>Elections</h3>
                  <div className="actions">
                    <input 
                      value={title} 
                      onChange={e=>setTitle(e.target.value)} 
                      placeholder="New election title..." 
                      className="compact"
                    />
                    <button onClick={createElection} className="primary small">
                      Create Election
                    </button>
                  </div>
                </div>

                <div className="list">
                  {elections.length === 0 ? (
                    <div className="empty-state">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd"/>
                      </svg>
                      <p>No elections yet</p>
                      <p className="text-sm text-muted">Create your first election above</p>
                    </div>
                  ) : (
                    elections.map(election => (
                      <div key={election.id} className="list-item">
                        <div className="item-header">
                          <div>
                            <h4>{election.title}</h4>
                            <p className="text-sm text-muted">
                              {candidates.filter(c => c.election_id === election.id).length} candidates
                            </p>
                          </div>
                          <button onClick={() => deleteElection(election.id)} className="danger small icon-only" title="Delete election">
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                            </svg>
                          </button>
                        </div>
                        
                        <div className="candidates">
                          {candidates.filter(c => c.election_id === election.id).map(candidate => (
                            <div key={candidate.id} className="candidate-item">
                              <div className="candidate-avatar">
                                {candidate.name.charAt(0)}
                              </div>
                              <span>{candidate.name}</span>
                              <button 
                                onClick={() => deleteCandidate(candidate.id)} 
                                className="danger icon-only small"
                                title="Remove candidate"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                          
                          <button 
                            className="add-candidate"
                            onClick={() => {
                              setSelectedElection(election.id)
                              const name = window.prompt('Enter candidate name:')
                              if(name) {
                                setCandidateName(name)
                                addCandidate()
                              }
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                            </svg>
                            Add Candidate
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="sidebar">
              <div className="card">
                <h3>Quick Actions</h3>
                <div className="quick-actions">
                  <button className="action-button" onClick={() => window.location.href='/vote'}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                    </svg>
                    View Active Elections
                  </button>
                  <button className="action-button" onClick={() => window.location.href='/results'}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                    </svg>
                    View Results
                  </button>
                </div>

                <div style={{marginTop: 24}}>
                  <h4>Tips</h4>
                  <ul className="tips">
                    <li>Create an election first</li>
                    <li>Add candidates to the election</li>
                    <li>Elections start immediately when created</li>
                    <li>You can delete elections or candidates anytime</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h3>Users</h3>
            </div>

            <div className="user-list">
              {users.length === 0 ? (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                  </svg>
                  <p>No users yet</p>
                </div>
              ) : (
                users.map(user => (
                  <div key={user.id} className="user-item">
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.name?.charAt(0) || user.email?.charAt(0)}
                      </div>
                      <div>
                        <h4>{user.name || 'Unnamed'}</h4>
                        <div className="text-sm text-muted">{user.email}</div>
                        <div className="badge">{user.role}</div>
                      </div>
                    </div>

                    <div className="user-actions">
                      {user.role !== 'admin' && (
                        <button onClick={() => changeRole(user.id, 'admin')} className="secondary small">
                          Make Admin
                        </button>
                      )}
                      {user.role !== 'voter' && (
                        <button onClick={() => changeRole(user.id, 'voter')} className="secondary small">
                          Make Voter
                        </button>
                      )}
                      <button onClick={() => deleteUser(user.id)} className="danger small icon-only" title="Delete user">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {msg && (
          <div className={`alert ${msg.includes('error')? 'alert-error' : 'alert-success'}`}>
            {msg}
          </div>
        )}
      </div>

      <style jsx="true">{`
        .admin-page {
          min-height: calc(100vh - 64px);
          padding: 2rem 0;
          background: var(--gray-50);
        }

        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .tab-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: 0.375rem;
          color: var(--gray-700);
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab-button:hover {
          background: var(--gray-50);
        }

        .tab-button.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .tab-button .icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .admin-grid {
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

        .actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        input.compact {
          margin: 0;
          width: auto;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .list-item {
          background: var(--gray-50);
          border-radius: 0.5rem;
          padding: 1rem;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .candidates {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .candidate-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .candidate-avatar {
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 0.375rem;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .add-candidate {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem;
          background: white;
          border: 1px dashed var(--gray-300);
          border-radius: 0.375rem;
          color: var(--gray-600);
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .add-candidate:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: var(--gray-50);
        }

        .icon-only {
          padding: 0.25rem;
          line-height: 0;
        }

        .icon-only .icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
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
          border: none;
          cursor: pointer;
          text-align: left;
          width: 100%;
        }

        .action-button:hover {
          background: var(--gray-100);
          color: var(--gray-900);
        }

        .tips {
          list-style-type: none;
          padding: 0;
          margin: 0.5rem 0 0;
          font-size: 0.875rem;
          color: var(--gray-600);
        }

        .tips li {
          padding-left: 1.25rem;
          position: relative;
          margin-bottom: 0.375rem;
        }

        .tips li:before {
          content: "•";
          position: absolute;
          left: 0.375rem;
          color: var(--primary);
        }

        .user-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .user-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: var(--gray-50);
          border-radius: 0.5rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.5rem;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
        }

        .user-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .badge {
          display: inline-block;
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
          background: var(--gray-100);
          color: var(--gray-700);
          font-size: 0.75rem;
          font-weight: 500;
          margin-top: 0.25rem;
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

        @media (max-width: 768px) {
          .admin-grid {
            grid-template-columns: 1fr;
          }

          .user-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .user-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  )
}
