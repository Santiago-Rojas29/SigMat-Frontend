import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import api from '../services/api'

const PermissionsContext = createContext(null)

export function PermissionsProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [modules, setModules] = useState({})
  const [loading, setLoading] = useState(false)

  const loadPermissions = useCallback(async () => {
    if (!isAuthenticated) {
      setModules({})
      return
    }
    setLoading(true)
    try {
      const { data } = await api.get('/auth/permisos')
      setModules(data.modulos ?? {})
    } catch {
      setModules({})
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  const hasPermission = useCallback(
    (module) => module in modules,
    [modules],
  )

  const hasSubPermission = useCallback(
    (module, submodule) => {
      const subs = modules[module]
      if (!subs) return false
      if (subs.length === 0) return true
      return subs.includes(submodule)
    },
    [modules],
  )

  const hasAnyPermission = useCallback(
    (mods) => mods.some((m) => m in modules),
    [modules],
  )

  return (
    <PermissionsContext.Provider
      value={{ modules, loading, hasPermission, hasSubPermission, hasAnyPermission, reload: loadPermissions }}
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
