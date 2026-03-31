import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('kotibaai_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kotibaai_token')
      localStorage.removeItem('kotibaai_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data)
}

export const assistantAPI = {
  respond: (text) => api.post('/assistant/respond', { text })
}

export const voiceAPI = {
  processVoice: (formData) => api.post('/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  speak: (text) => api.post('/voice/speak', { text }, { responseType: 'blob' })
}

export const tasksAPI = {
  getAll: (filter) => api.get('/tasks', { params: { filter } }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  complete: (id) => api.patch(`/tasks/${id}/complete`)
}

export const expensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getSummary: () => api.get('/expenses/summary'),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`)
}

export const conversationAPI = {
  getHistory: () => api.get('/conversations'),
  clearHistory: () => api.delete('/conversations')
}

export const pushAPI = {
  getVapidKey: () => api.get('/push/vapid-key'),
  subscribe: (subscription) => api.post('/push/subscribe', { subscription }),
  unsubscribe: () => api.post('/push/unsubscribe'),
  test: () => api.post('/push/test')
}

export default api
