import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PermissionsProvider } from './context/PermissionsContext'
import { SocketProvider } from './context/SocketContext'
import { PrivateRoute } from './routes/PrivateRoute'
import { PermissionRoute } from './routes/PermissionRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { UsuariosPage }    from './pages/admin/UsuariosPage'
import { CentrosPage }      from './pages/estructura/CentrosPage'
import { SedesPage }        from './pages/estructura/SedesPage'
import { AreasPage }        from './pages/estructura/AreasPage'
import { ProgramasPage }    from './pages/estructura/ProgramasPage'
import { FichasPage }       from './pages/estructura/FichasPage'
import { RolesPage }       from './pages/admin/RolesPage'
import { UbicacionesPage }  from './pages/inventario/UbicacionesPage'
import { MaterialesPage }   from './pages/inventario/MaterialesPage'
import { LotesPage }        from './pages/inventario/LotesPage'
import { UnidadesPage }     from './pages/inventario/UnidadesPage'
import { SolicitudesPage }  from './pages/movimientos/SolicitudesPage'
import { PrestamosPage }   from './pages/movimientos/PrestamosPage'
import { IncidenciasPage } from './pages/control/IncidenciasPage'
import { TrasladosPage }  from './pages/control/TrasladosPage'
import { KardexPage }     from './pages/control/KardexPage'
import { ReportesPage }  from './pages/reportes/ReportesPage'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
      <PermissionsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected — requires authentication */}
            <Route element={<PrivateRoute />}>
              <Route element={<AppLayout />}>

                {/* Dashboard — always visible */}
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Reportes — always visible */}
                <Route path="/reportes" element={<ReportesPage />} />

                {/* Estructura — solo administradores */}
                <Route element={<PermissionRoute module="administracion" />}>
                  <Route path="/estructura/centros"  element={<CentrosPage />} />
                  <Route path="/estructura/sedes"    element={<SedesPage />} />
                  <Route path="/estructura/areas"    element={<AreasPage />} />
                  <Route path="/estructura/programas"element={<ProgramasPage />} />
                  <Route path="/estructura/fichas"   element={<FichasPage />} />
                </Route>

                {/* Administración — requires 'administracion' */}
                <Route element={<PermissionRoute module="administracion" />}>
                  <Route path="/admin/usuarios" element={<UsuariosPage />} />
                  <Route path="/admin/roles" element={<RolesPage />} />
                </Route>

                {/* Inventario */}
                <Route element={<PermissionRoute module="inventario" />}>
                  <Route path="/inventario/materiales" element={<MaterialesPage />} />
                  <Route path="/inventario/lotes"      element={<LotesPage />} />
                  <Route path="/inventario/unidades"   element={<UnidadesPage />} />
                  <Route path="/inventario/ubicaciones" element={<UbicacionesPage />} />
                </Route>

                {/* Movimientos */}
                <Route element={<PermissionRoute module="movimientos" />}>
                  <Route path="/movimientos/solicitudes" element={<SolicitudesPage />} />
                  <Route path="/movimientos/prestamos"   element={<PrestamosPage />} />
                </Route>

                {/* Control y Seguimiento */}
                <Route element={<PermissionRoute module="control" />}>
                  <Route path="/control/traslados"   element={<TrasladosPage />} />
                  <Route path="/control/incidencias" element={<IncidenciasPage />} />
                  <Route path="/control/kardex"      element={<KardexPage />} />
                </Route>

              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </PermissionsProvider>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
