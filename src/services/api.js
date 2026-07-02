import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sigmat_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    if (status === 401) {
      localStorage.removeItem('sigmat_token')
      localStorage.removeItem('sigmat_user')
      window.location.replace('/login')
    }
    if (status === 429) {
      localStorage.removeItem('sigmat_token')
      localStorage.removeItem('sigmat_user')
      const msg =
        err.response?.data?.mensaje ??
        'Has superado el límite de solicitudes. Espera un momento e intenta de nuevo.'
      sessionStorage.setItem('sigmat_rate_error', msg)
      window.location.replace('/login')
    }
    return Promise.reject(err)
  },
)

export default api
