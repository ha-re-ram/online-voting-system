import axios from 'axios'

// Auto-detect environment to dynamically set API base path:
// - On Cloudflare Pages (non-localhost), route API calls to the serverless '/api' prefix
// - On local Vite dev server, route to local Express port 4000
// - On local production Express server, route to root same-origin
const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

const baseURL = import.meta.env.VITE_API_URL || 
  (isLocal ? (import.meta.env.MODE === 'development' ? 'http://localhost:4000' : '') : '/api')

const api = axios.create({ baseURL })

// attach token
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) {
    cfg.headers = cfg.headers || {}
    cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})

export default api
