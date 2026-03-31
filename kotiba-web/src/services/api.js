import axios from 'axios'

const BASE_URL = 'http://localhost:3000/api'

// Axios instance — token avtomatik qo'shiladi
const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('kotiba_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── AUTH ────────────────────────────────────────────────
export const authApi = {
  login:    (phone)       => api.post('/auth/login', { phone }),
  register: (phone, name) => api.post('/auth/register', { phone, name }),
  setPin:   (pin)         => api.post('/auth/pin', { pin }),
  pinLogin: (phone, pin)  => api.post('/auth/pin-login', { phone, pin }),
  profile:  ()            => api.get('/auth/profile'),
}

// ─── REMINDERS ───────────────────────────────────────────
export const remindersApi = {
  getAll: ()          => api.get('/reminders'),
  create: (data)      => api.post('/reminders', data),
  update: (id, data)  => api.put(`/reminders/${id}`, data),
  delete: (id)        => api.delete(`/reminders/${id}`),
}

// ─── TASKS ───────────────────────────────────────────────
export const tasksApi = {
  getAll: ()          => api.get('/tasks'),
  create: (data)      => api.post('/tasks', data),
  update: (id, data)  => api.put(`/tasks/${id}`, data),
  delete: (id)        => api.delete(`/tasks/${id}`),
}

// ─── FINANCE ─────────────────────────────────────────────
export const financeApi = {
  getAll:        ()           => api.get('/finance'),
  getStats:      (period)     => api.get(`/finance/stats?period=${period}`),
  getCategories: ()           => api.get('/finance/categories'),
  create:        (data)       => api.post('/finance', data),
  update:        (id, data)   => api.put(`/finance/${id}`, data),
  delete:        (id)         => api.delete(`/finance/${id}`),
}

// ─── CLIENTS ─────────────────────────────────────────────
export const clientsApi = {
  getAll:  ()          => api.get('/clients'),
  create:  (data)      => api.post('/clients', data),
  update:  (id, data)  => api.put(`/clients/${id}`, data),
  delete:  (id)        => api.delete(`/clients/${id}`),
  // Excel yuklab olish — token qo'lda qo'shiladi
  exportExcel: async () => {
    const token = localStorage.getItem('kotiba_token')
    const res = await fetch(`${BASE_URL}/clients/export`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Export xatolik')
    return res.blob()
  },
}

// ─── VOICE ───────────────────────────────────────────────
export const voiceApi = {
  // FormData bilan audio yuborish
  processAudio: (formData) => api.post('/voice/process', formData),

  // TTS — ArrayBuffer qaytaradi
  tts: (text) =>
    api.post('/voice/tts', { text }, { responseType: 'arraybuffer' }),
}

export default api
