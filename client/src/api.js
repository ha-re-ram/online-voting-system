import axios from 'axios'

// Point to API server in development, same origin in production
const isDev = import.meta.env.MODE === 'development'
const baseURL = isDev ? 'http://localhost:4000' : '/'
const api = axios.create({ baseURL })

// attach token
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if(token) cfg.headers = cfg.headers || {}, cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export default api
