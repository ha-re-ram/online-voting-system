import axios from 'axios'

// Support dynamic backend URL from environment variables in production, falling back to same-origin or localhost
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:4000' : '')
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
