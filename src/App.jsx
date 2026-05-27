import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PermissionsProvider } from './context/PermissionsContext'
import { PrivateRoute } from './routes/PrivateRoute'
import { PermissionRoute } from './routes/PermissionRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { UsuariosPage } from './pages/admin/UsuariosPage'

function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected — requires authentication */}
            <Route element={<PrivateRoute />}>
              <Route element={<AppLayout />}>

                {/* Dashboard — always visible */}
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Estructura — always visible */}
                <Route path="/estructura/centros"  element={<PlaceholderPage title="Centros"   module="estructura" />} />
                <Route path="/estructura/sedes"    element={<PlaceholderPage title="Sedes"     module="estructura" />} />
                <Route path="/estructura/areas"    element={<PlaceholderPage title="Áreas"     module="estructura" />} />
                <Route path="/estructura/programas"element={<PlaceholderPage title="Programas" module="estructura" />} />
                <Route path="/estructura/fichas"   element={<PlaceholderPage title="Fichas"    module="estructura" />} />

                {/* Administración — requires 'usuarios' */}
                <Route element={<PermissionRoute module="usuarios" />}>
                  <Route path="/admin/usuarios" element={<UsuariosPage />} />
                  <Route path="/admin/roles"    element={<PlaceholderPage title="Roles"    module="usuarios" />} />
                  <Route path="/admin/permisos" element={<PlaceholderPage title="Permisos" module="usuarios" />} />
                </Route>

                {/* Inventario — materiales */}
                <Route element={<PermissionRoute module="materiales" />}>
                  <Route path="/inventario/materiales" element={<PlaceholderPage title="Materiales" module="materiales" />} />
                  <Route path="/inventario/lotes"      element={<PlaceholderPage title="Lotes"      module="materiales" />} />
                  <Route path="/inventario/unidades"   element={<PlaceholderPage title="Unidades"   module="materiales" />} />
                </Route>

                {/* Inventario — ubicaciones */}
                <Route element={<PermissionRoute module="ubicaciones" />}>
                  <Route path="/inventario/ubicaciones" element={<PlaceholderPage title="Ubicaciones" module="ubicaciones" />} />
                </Route>

                {/* Movimientos: Solicitudes (incluye validación) + Préstamos (incluye entregas/devoluciones) */}
                <Route element={<PermissionRoute module="prestamos" />}>
                  <Route path="/movimientos/solicitudes" element={<PlaceholderPage title="Solicitudes" module="prestamos" />} />
                  <Route path="/movimientos/prestamos"   element={<PlaceholderPage title="Préstamos"   module="prestamos" />} />
                </Route>

                {/* Control y Seguimiento — requires 'inventario' */}
                <Route element={<PermissionRoute module="inventario" />}>
                  <Route path="/control/traslados"   element={<PlaceholderPage title="Traslados"   module="inventario" />} />
                  <Route path="/control/incidencias" element={<PlaceholderPage title="Incidencias" module="inventario" />} />
                  <Route path="/control/kardex"      element={<PlaceholderPage title="Kardex"      module="inventario" />} />
                </Route>

              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </PermissionsProvider>
    </AuthProvider>
  )
}

export default App
