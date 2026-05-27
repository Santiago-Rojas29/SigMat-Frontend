import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
})

function parseJwtPayload(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

export async function loginRequest(payload) {
  const { data } = await api.post('/auth/login', payload)
  const decoded = parseJwtPayload(data.access_token)
  return {
    access_token: data.access_token,
    user: { id: decoded.sub, correo: decoded.correo, id_rol: decoded.id_rol },
  }
}
