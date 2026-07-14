import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '../context/PermissionsContext'

export function RootRoute() {
  const { rolNombre } = usePermissions()

  if (rolNombre !== 'Root') return <Navigate to="/dashboard" replace />

  return <Outlet />
}
