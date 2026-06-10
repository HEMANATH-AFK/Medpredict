import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — handle 401 → logout
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  refresh:  (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
}

export const predictApi = {
  questions: (data) => api.post('/predict/triage/questions', data),
  predict:   (data) => api.post('/predict/triage/predict', data),
  whatif:    (data) => api.post('/predict/whatif', data),
  history:   (page = 1, limit = 10) => api.get(`/predict/history?page=${page}&limit=${limit}`),
  getOne:    (id)  => api.get(`/predict/${id}`),
}

// ── Reports ───────────────────────────────────────────────────────
export const reportApi = {
  download: async (predictionId) => {
    const token = useAuthStore.getState().token
    const res = await fetch(`/api/report/${predictionId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Failed to download report')
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `medpredict_report_${predictionId.slice(0, 8)}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  },
}

// ── Analytics ─────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  admin:     () => api.get('/analytics/admin'),
  shapGlobal:() => api.get('/analytics/shap-global'),
}
