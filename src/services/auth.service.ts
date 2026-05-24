import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})

export interface LoginPayload {
  correo: string
  contrasena: string
}

export interface LoginResponse {
  access_token: string
}

function parseJwtPayload(token: string): { sub: string; correo: string; id_rol: string } {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse & { user: { id: string; correo: string; id_rol: string } }> {
  const { data } = await api.post<LoginResponse>('/auth/login', payload)
  const payload_decoded = parseJwtPayload(data.access_token)
  return {
    access_token: data.access_token,
    user: { id: payload_decoded.sub, correo: payload_decoded.correo, id_rol: payload_decoded.id_rol },
  }
}
