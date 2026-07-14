import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/api$/, '')

export function SocketProvider({ children }) {
  const { token } = useAuth()
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (!token) {
      setSocket(prev => { prev?.disconnect(); return null })
      return
    }

    const s = io(`${BASE_URL}/notifications`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 5,
    })

    s.on('connect_error', () => {})

    setSocket(s)

    return () => {
      s.disconnect()
      setSocket(null)
    }
  }, [token])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
