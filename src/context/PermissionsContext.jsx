import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import api from '../services/api'

const PermissionsContext = createContext(null)

export function PermissionsProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const [modules,    setModules]    = useState({})
  const [loading,    setLoading]    = useState(true)

  // El nombre del rol viaja en el propio JWT — no requiere fetch aparte
  // ni depende de /rol, que excluye deliberadamente el rol "Root" de su listado.
  const rolNombre = user?.rolNombre ?? null

  const loadPermissions = useCallback(async () => {
    if (!isAuthenticated) {
      setModules({})
      setLoading(false)
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

  // modules[modulo] es un mapa { submodulo: acciones[] }; la clave '' representa
  // "módulo completo" (todos los submódulos, con esas acciones).
  const hasSubPermission = useCallback(
    (module, submodule) => {
      const subs = modules[module]
      if (!subs) return false
      if ('' in subs) return true
      return submodule in subs
    },
    [modules],
  )

  const hasAnyPermission = useCallback(
    (mods) => mods.some((m) => m in modules),
    [modules],
  )

  // acciones: [] en una entrada = todas las acciones permitidas para ese submódulo/módulo
  const hasAction = useCallback(
    (module, submodule, action) => {
      const subs = modules[module]
      if (!subs) return false
      const acciones = subs[submodule] ?? subs['']
      if (acciones === undefined) return false
      return acciones.length === 0 || acciones.includes(action)
    },
    [modules],
  )

  return (
    <PermissionsContext.Provider
      value={{ modules, loading, rolNombre, hasPermission, hasSubPermission, hasAnyPermission, hasAction, reload: loadPermissions }}
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
