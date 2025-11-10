import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'

export default function ResultsPage(){
  const [elections, setElections] = useState([])
  const { id: routeId } = useParams()
  const [electionId, setElectionId] = useState(routeId || '')
  const [results, setResults] = useState([])

  useEffect(()=>{ loadElections() }, [])
  async function loadElections(){
    const res = await api.get('/elections')
    setElections(res.data)
    // if no election id in route, default to first election
    if(!routeId && res.data[0]) setElectionId(res.data[0].id)
  }

  // if route contains an id, use it (overrides default)
  useEffect(()=>{
    if(routeId) setElectionId(routeId)
  }, [routeId])

  useEffect(()=>{ if(electionId) loadResults(electionId) }, [electionId])
  async function loadResults(id){
    const res = await api.get(`/results/${id}`)
    setResults(res.data.results || [])
  }

  // Calculate total votes and percentages
  const totalVotes = results.reduce((sum, r) => sum + r.total_votes, 0)
  const getPercentage = (votes) => ((votes / totalVotes) * 100).toFixed(1)

  // Sort results by votes (descending)
  const sortedResults = [...results].sort((a, b) => b.total_votes - a.total_votes)
  
  return (
    <div className="results-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h2>Election Results</h2>
            <p className="text-muted">View and analyze voting results</p>
          </div>
          
          <div className="election-select">
            <select 
              value={electionId} 
              onChange={e => setElectionId(e.target.value)}
              className="compact"
            >
              {elections.map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="results-grid">
          <div className="main-content">
            <div className="card">
              <div className="card-header">
                <h3>Vote Distribution</h3>
                <div className="total-votes">
                  <span className="text-muted">Total Votes:</span>
                  <strong>{totalVotes}</strong>
                </div>
              </div>

              {results.length === 0 ? (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                  <p>No votes recorded yet</p>
                  <p className="text-sm text-muted">Results will appear here once voting begins</p>
                </div>
              ) : (
                <div className="results-list">
                  {sortedResults.map((result, index) => (
                    <div key={result.candidate_name} className="result-item">
                      <div className="result-header">
                        <div className="candidate-info">
                          <div className="rank">{index + 1}</div>
                          <div className="candidate-name">
                            <h4>{result.candidate_name}</h4>
                            <div className="text-sm">
                              <span className="text-muted">{result.total_votes} votes</span>
                              <span className="separator">•</span>
                              <strong>{getPercentage(result.total_votes)}%</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="progress-track">
                        <div 
                          className="progress-bar"
                          style={{
                            width: `${getPercentage(result.total_votes)}%`,
                            backgroundColor: index === 0 ? 'var(--primary)' : 'var(--gray-400)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="sidebar">
            <div className="card">
              <h3>Quick Stats</h3>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{totalVotes}</div>
                  <div className="stat-label">Total Votes</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-value">{results.length}</div>
                  <div className="stat-label">Candidates</div>
                </div>
                
                {results.length > 0 && (
                  <div className="stat-card">
                    <div className="stat-value">
                      {sortedResults[0]?.candidate_name?.split(' ')[0]}
                    </div>
                    <div className="stat-label">Leading Candidate</div>
                  </div>
                )}
              </div>

              <div style={{marginTop: 24}}>
                <h4>About Results</h4>
                <ul className="info-list">
                  <li>Results are updated in real-time</li>
                  <li>Percentages are based on total votes</li>
                  <li>Candidates are ranked by votes</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx="true">{`
        .results-page {
          min-height: calc(100vh - 64px);
          padding: 2rem 0;
          background: var(--gray-50);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .election-select {
          min-width: 200px;
        }

        .results-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem;
          align-items: start;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .total-votes {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .result-item {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .candidate-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .rank {
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gray-100);
          border-radius: 0.5rem;
          font-weight: 600;
          color: var(--gray-700);
        }

        .separator {
          margin: 0 0.5rem;
          color: var(--gray-300);
        }

        .progress-track {
          height: 0.5rem;
          background: var(--gray-100);
          border-radius: 0.25rem;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          transition: width 0.3s ease;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 1rem;
        }

        .stat-card {
          padding: 1rem;
          background: var(--gray-50);
          border-radius: 0.5rem;
          text-align: center;
        }

        .stat-card:nth-child(3) {
          grid-column: span 2;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--primary);
          line-height: 1.2;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--gray-600);
          margin-top: 0.25rem;
        }

        .info-list {
          list-style-type: none;
          padding: 0;
          margin: 0.5rem 0 0;
          font-size: 0.875rem;
          color: var(--gray-600);
        }

        .info-list li {
          padding-left: 1.25rem;
          position: relative;
          margin-bottom: 0.375rem;
        }

        .info-list li:before {
          content: "•";
          position: absolute;
          left: 0.375rem;
          color: var(--primary);
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
          .results-grid {
            grid-template-columns: 1fr;
          }

          .page-header {
            flex-direction: column;
            gap: 1rem;
          }

          .election-select {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
