import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import api from '../services/api'

const PermissionsContext = createContext(null)

export function PermissionsProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(false)

  const loadPermissions = useCallback(async () => {
    if (!isAuthenticated) {
      setModules([])
      return
    }
    setLoading(true)
    try {
      const { data } = await api.get('/auth/permisos')
      setModules(data.modulos ?? [])
    } catch {
      setModules([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  const hasPermission = useCallback(
    (module) => modules.includes(module),
    [modules],
  )

  const hasAnyPermission = useCallback(
    (mods) => mods.some((m) => modules.includes(m)),
    [modules],
  )

  return (
    <PermissionsContext.Provider
      value={{ modules, loading, hasPermission, hasAnyPermission, reload: loadPermissions }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext)
  if (!ctx) throw new Error('usePermissions debe usarse dentro de PermissionsProvider')
  return ctx
}
