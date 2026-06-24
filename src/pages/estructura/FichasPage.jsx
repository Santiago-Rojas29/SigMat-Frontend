import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { useAuth }          from '../../context/AuthContext'
import { usePermissions }   from '../../context/PermissionsContext'
import { AppButton }        from '../../components/atoms/AppButton'
import { AppInput }         from '../../components/atoms/AppInput'
import { AppDateInput }     from '../../components/atoms/AppDateInput'
import { AppSelect }        from '../../components/atoms/AppSelect'
import { SearchableSelect } from '../../components/atoms/SearchableSelect'
import { Badge }            from '../../components/atoms/Badge'
import { IconButton }     from '../../components/atoms/IconButton'
import { FormField }      from '../../components/molecules/FormField'
import { PageHeader }     from '../../components/molecules/PageHeader'
import { useToast }       from '../../hooks/useToast'
import { ConfirmDialog }  from '../../components/molecules/ConfirmDialog'
import { AppModal }       from '../../components/organisms/AppModal'
import { DataTable }      from '../../components/organisms/DataTable'
import { AppIcon }        from '../../components/atoms/AppIcon'
const ROL_EN_FICHA_OPTS = [
  { value: 'instructor', label: 'Instructor líder' },
  { value: 'aprendiz',   label: 'Aprendiz'         },
]

const ROL_VARIANT = { instructor: 'info', aprendiz: 'warning' }
const ROL_LABEL   = { instructor: 'Instructor líder', aprendiz: 'Aprendiz' }

const JORNADA_OPTS = [
  { value: 'manana',    label: 'Mañana' },
  { value: 'tarde',     label: 'Tarde' },
  { value: 'nocturna',  label: 'Nocturna' },
]

const ESTADO_FICHA_OPTS = [
  { value: 'en formacion', label: 'En formación' },
  { value: 'terminada',    label: 'Terminada' },
  { value: 'cancelada',    label: 'Cancelada' },
]

const EMPTY_FORM = {
  id_programa: '', codigo_ficha: '', fecha_inicio: '', fecha_fin: '', jornada: '', estado: 'en formacion',
}

export function FichasPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const isAdmin = hasPermission('administracion')

  const [fichas,       setFichas]       = useState([])
  const [programas,    setProgramas]    = useState([])
  const [usuarios,     setUsuarios]     = useState([])
  const [roles,        setRoles]        = useState([])
  const [fichaUsuarios,setFichaUsuarios]= useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const [modal,     setModal]     = useState(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)

  const { showToast, toastPortal } = useToast()

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  // ── Miembros modal ────────────────────────────────────────────────────────
  const [membrosModal,   setMiembrosModal]   = useState(null)
  const [miembroForm,    setMiembroForm]     = useState({ id_usuario: '', rol_en_ficha: 'aprendiz' })
  const [miembroSaving,  setMiembroSaving]   = useState(false)
  const [miembroDeleting,setMiembroDeleting] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [fichasRes, progRes, usuRes, rolRes, fuRes] = await Promise.all([
        api.get('/ficha'),
        api.get('/programa'),
        api.get('/usuario'),
        api.get('/rol'),
        api.get('/ficha-usuario'),
      ])
      setFichas(fichasRes.data)
      setProgramas(progRes.data)
      setUsuarios(usuRes.data)
      setRoles(rolRes.data)
      setFichaUsuarios(fuRes.data)
    } catch {
      setError('No se pudo cargar la información. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const programaMap = Object.fromEntries(
    programas.map(p => [p.id_programa, p.nombre])
  )

  const jornadaLabel = Object.fromEntries(
    JORNADA_OPTS.map(o => [o.value, o.label])
  )

  const estadoLabel = Object.fromEntries(
    ESTADO_FICHA_OPTS.map(o => [o.value, o.label])
  )

  function formatDate(iso) {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  function toDateInputValue(iso) {
    if (!iso) return ''
    return iso.slice(0, 10)
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FORM })
    setModal({ mode: 'create' })
  }

  const openEdit = (f) => {
    setForm({
      id_programa: String(f.id_programa), codigo_ficha: f.codigo_ficha,
      fecha_inicio: toDateInputValue(f.fecha_inicio), fecha_fin: toDateInputValue(f.fecha_fin),
      jornada: f.jornada, estado: f.estado,
    })
    setModal({ mode: 'edit', data: f })
  }

  const closeModal = () => { setModal(null) }

  const handleSave = async () => {
    if (!form.id_programa || !form.codigo_ficha || !form.fecha_inicio || !form.fecha_fin || !form.jornada) {
      showToast('error', 'Todos los campos obligatorios deben estar llenos.')
      return
    }
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await api.post('/ficha', form)
        showToast('success', 'Ficha creada correctamente.')
      } else {
        await api.patch(`/ficha/${modal.data.id_ficha}`, form)
        showToast('success', 'Ficha actualizada correctamente.')
      }
      closeModal()
      loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/ficha/${deleteTarget.id_ficha}`)
      showToast('success', 'Ficha eliminada correctamente.')
      setDeleteTarget(null)
      loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkDelete = async (ids) => {
    await Promise.all(ids.map(id => api.delete(`/ficha/${id}`)))
    loadData()
  }

  // ── Lógica de miembros ────────────────────────────────────────────────────

  const miembrosDeFicha = membrosModal
    ? fichaUsuarios.filter(fu => fu.id_ficha === membrosModal.id_ficha)
    : []

  const yaHayInstructor = miembrosDeFicha.some(fu => fu.rol_en_ficha === 'instructor')

  const rolNombreDeUsuario = (u) =>
    roles.find(r => r.id === u.id_rol)?.nombre?.toLowerCase() ?? ''

  const aprendicesEnAlgunaFicha = new Set(
    fichaUsuarios.filter(fu => fu.rol_en_ficha === 'aprendiz').map(fu => fu.id_usuario)
  )

  const usuariosDisponibles = usuarios
    .filter(u => !miembrosDeFicha.some(fu => fu.id_usuario === u.id))
    .filter(u => {
      const rn = rolNombreDeUsuario(u)
      if (miembroForm.rol_en_ficha === 'instructor') return rn.includes('instructor')
      if (miembroForm.rol_en_ficha === 'aprendiz')   return rn.includes('aprendiz') && !aprendicesEnAlgunaFicha.has(u.id)
      return true
    })

  const fmtNombre = u => u ? `${u.nombres ?? ''} ${u.apellidos ?? ''}`.trim() || u.correo : '—'

  const openMiembros = (ficha) => {
    const yaInstructor = fichaUsuarios.some(fu => fu.id_ficha === ficha.id_ficha && fu.rol_en_ficha === 'instructor')
    setMiembrosModal(ficha)
    setMiembroForm({ id_usuario: '', rol_en_ficha: yaInstructor ? 'aprendiz' : 'instructor' })
  }

  const closeMiembros = () => {
    setMiembrosModal(null)
  }

  const handleMiembroAgregar = async () => {
    if (!miembroForm.id_usuario) { showToast('error', 'Selecciona un usuario.'); return }
    setMiembroSaving(true)
    try {
      await api.post('/ficha-usuario', {
        id_ficha:     membrosModal.id_ficha,
        id_usuario:   miembroForm.id_usuario,
        rol_en_ficha: miembroForm.rol_en_ficha,
      })
      showToast('success', 'Miembro agregado correctamente.')
      const fuRes = await api.get('/ficha-usuario')
      setFichaUsuarios(fuRes.data)
      setMiembroForm({ id_usuario: '', rol_en_ficha: 'aprendiz' })
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al agregar.'))
    } finally { setMiembroSaving(false) }
  }

  const handleMiembroEliminar = async (id_ficha, id_usuario) => {
    setMiembroDeleting(id_usuario)
    try {
      await api.delete(`/ficha-usuario/${id_ficha}/${id_usuario}`)
      showToast('success', 'Miembro eliminado correctamente.')
      setFichaUsuarios(prev => prev.filter(fu => !(fu.id_ficha === id_ficha && fu.id_usuario === id_usuario)))
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
    } finally { setMiembroDeleting(null) }
  }

  // ── Datos filtrados según rol ────────────────────────────────────────────
  const misFichaIds = !isAdmin
    ? new Set(fichaUsuarios.filter(fu => fu.id_usuario === user?.id).map(fu => fu.id_ficha))
    : null

  const fichasVisibles = isAdmin ? fichas : fichas.filter(f => misFichaIds.has(f.id_ficha))

  const columns = [
    {
      key: 'id_ficha',
      header: 'ID',
      copyable: true,
      truncateAt: 8,
      searchable: false,
      width: 110,
    },
    {
      key: 'codigo_ficha',
      header: 'Código',
      render: (f) => (
        <span style={{ fontWeight: 500, color: '#111827' }}>
          {f.codigo_ficha}
        </span>
      ),
    },
    {
      key: 'id_programa',
      header: 'Programa',
      render: (f) => programaMap[f.id_programa] ?? <span style={{ color: '#9CA3AF' }}>—</span>,
    },
    {
      key: 'fecha_inicio',
      header: 'Inicio',
      render: (f) => formatDate(f.fecha_inicio),
    },
    {
      key: 'fecha_fin',
      header: 'Fin',
      render: (f) => formatDate(f.fecha_fin),
    },
    {
      key: 'jornada',
      header: 'Jornada',
      render: (f) => jornadaLabel[f.jornada] ?? <span style={{ color: '#9CA3AF' }}>—</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (f) => {
        const v = f.estado === 'en formacion' ? 'warning'
                : f.estado === 'terminada'    ? 'success'
                : 'default'
        return <Badge variant={v}>{estadoLabel[f.estado] ?? f.estado}</Badge>
      },
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: isAdmin ? 90 : 60,
      searchable: false,
      render: (f) => {
        const totalMiembros = fichaUsuarios.filter(fu => fu.id_ficha === f.id_ficha).length
        if (!isAdmin) {
          return (
            <IconButton
              title="Ver miembros"
              onClick={() => openMiembros(f)}
              style={{ color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe' }}
            >
              <AppIcon name="eye" size={15} />
            </IconButton>
          )
        }
        return (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              title="Gestionar miembros"
              onClick={() => openMiembros(f)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb',
                fontSize: 12, fontWeight: 600,
              }}
            >
              <AppIcon name="users" size={13} />
              {totalMiembros > 0 ? totalMiembros : '+'} miembro{totalMiembros !== 1 ? 's' : ''}
            </button>
            <IconButton variant="edit" title="Editar" onClick={() => openEdit(f)}>
              <AppIcon name="edit" size={15} />
            </IconButton>
            <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(f)}>
              <AppIcon name="trash" size={15} />
            </IconButton>
          </div>
        )
      },
    },
  ]

  return (
    <>
      {toastPortal}
      <div>
      <PageHeader
        title={isAdmin ? 'Fichas' : 'Mis Fichas'}
        description={isAdmin
          ? 'Gestión de fichas de los programas de formación del SENA'
          : 'Fichas de formación donde estás asignado. Consulta los miembros de cada ficha.'}
      />

      <DataTable
        columns={columns}
        data={fichasVisibles}
        rowKey="id_ficha"
        loading={loading}
        error={error}
        onRetry={loadData}
        searchable
        searchPlaceholder="Buscar por código, programa, jornada…"
        pageSize={10}
        selectable={isAdmin}
        onBulkDelete={isAdmin ? handleBulkDelete : undefined}
        emptyTitle={isAdmin ? 'Sin fichas' : 'Sin fichas asignadas'}
        emptyDescription={isAdmin ? 'Crea la primera ficha.' : 'No estás asignado a ninguna ficha.'}
        emptyAction={isAdmin
          ? <AppButton size="compact" onClick={openCreate}><AppIcon name="plus" /> Nueva ficha</AppButton>
          : null
        }
        actions={
          isAdmin ? (
            <>
              <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
                <AppIcon name="refresh" /> Actualizar
              </AppButton>
              <AppButton size="compact" onClick={openCreate}>
                <AppIcon name="plus" /> Nueva ficha
              </AppButton>
            </>
          ) : (
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <AppIcon name="refresh" /> Actualizar
            </AppButton>
          )
        }
      />

      {isAdmin && <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        maxWidth={640}
        title={modal?.mode === 'create' ? 'Nueva ficha' : 'Editar ficha'}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={closeModal} disabled={saving}>
              Cancelar
            </AppButton>
            <AppButton size="compact" onClick={handleSave} loading={saving}>
              {modal?.mode === 'create' ? 'Crear ficha' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <FormField label="Programa" required>
                <SearchableSelect
                  size="sm"
                  value={form.id_programa}
                  placeholder="Seleccionar programa"
                  options={programas.map(p => ({ value: p.id_programa, label: p.nombre }))}
                  onChange={v => set('id_programa', v)}
                />
              </FormField>
            </div>
            <div style={{ flex: 1 }}>
              <FormField label="Código de ficha" required>
                <AppInput size="sm" value={form.codigo_ficha} placeholder="Ej. 2874590"
                  onChange={e => set('codigo_ficha', e.target.value)} />
              </FormField>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <FormField label="Fecha de inicio" required>
                <AppDateInput size="sm" value={form.fecha_inicio}
                  onChange={e => set('fecha_inicio', e.target.value)} />
              </FormField>
            </div>
            <div style={{ flex: 1 }}>
              <FormField label="Fecha de fin" required>
                <AppDateInput size="sm" value={form.fecha_fin}
                  onChange={e => set('fecha_fin', e.target.value)} />
              </FormField>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <FormField label="Jornada" required>
                <AppSelect size="sm" value={form.jornada}
                  onChange={e => set('jornada', e.target.value)}>
                  <option value="">Seleccionar jornada</option>
                  {JORNADA_OPTS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </AppSelect>
              </FormField>
            </div>
            <div style={{ flex: 1 }}>
              <FormField label="Estado" required>
                <AppSelect size="sm" value={form.estado}
                  onChange={e => set('estado', e.target.value)}>
                  {ESTADO_FICHA_OPTS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </AppSelect>
              </FormField>
            </div>
          </div>

        </div>
      </AppModal>}

      {/* ── Modal de miembros ─────────────────────────────────────────────── */}
      <AppModal
        isOpen={!!membrosModal}
        onClose={closeMiembros}
        title={`Miembros — Ficha ${membrosModal?.codigo_ficha ?? ''}`}
        maxWidth={640}
        footer={
          <AppButton variant="ghost" size="compact" onClick={closeMiembros}>Cerrar</AppButton>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Lista de miembros actuales */}
          {miembrosDeFicha.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
              Esta ficha aún no tiene miembros asignados.
            </p>
          ) : (
            <>
              {/* Instructores */}
              {miembrosDeFicha.filter(fu => fu.rol_en_ficha === 'instructor').length > 0 && (
                <div>
                  <p style={{ fontSize: 11.5, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
                    Instructor líder
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {miembrosDeFicha.filter(fu => fu.rol_en_ficha === 'instructor').map(fu => {
                      const u = usuarios.find(u => u.id === fu.id_usuario)
                      return (
                        <div key={fu.id_usuario} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '9px 14px', borderRadius: 8,
                          background: '#eff6ff', border: '1px solid #bfdbfe',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#1d4ed8' }}>{fmtNombre(u)}</span>
                          </div>
                          {isAdmin && (
                            <IconButton
                              title="Quitar de la ficha"
                              disabled={miembroDeleting === fu.id_usuario}
                              onClick={() => handleMiembroEliminar(fu.id_ficha, fu.id_usuario)}
                              style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}
                            >
                              <AppIcon name="trash" size={13} />
                            </IconButton>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Aprendices */}
              {miembrosDeFicha.filter(fu => fu.rol_en_ficha === 'aprendiz').length > 0 && (
                <div>
                  <p style={{ fontSize: 11.5, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
                    Aprendices
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {miembrosDeFicha.filter(fu => fu.rol_en_ficha === 'aprendiz').map(fu => {
                      const u = usuarios.find(u => u.id === fu.id_usuario)
                      return (
                        <div key={fu.id_usuario} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '9px 14px', borderRadius: 8,
                          background: '#fffbeb', border: '1px solid #fde68a',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#92400e' }}>{fmtNombre(u)}</span>
                          </div>
                          {isAdmin && (
                            <IconButton
                              title="Quitar de la ficha"
                              disabled={miembroDeleting === fu.id_usuario}
                              onClick={() => handleMiembroEliminar(fu.id_ficha, fu.id_usuario)}
                              style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}
                            >
                              <AppIcon name="trash" size={13} />
                            </IconButton>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Formulario para agregar miembro — solo admin */}
          {isAdmin && (
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Agregar miembro
              </p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <FormField label="Rol" style={{ flex: 1 }}>
                  <AppSelect
                    size="sm"
                    value={miembroForm.rol_en_ficha}
                    onChange={e => setMiembroForm(p => ({ ...p, id_usuario: '', rol_en_ficha: e.target.value }))}
                  >
                    {ROL_EN_FICHA_OPTS
                      .filter(o => !(o.value === 'instructor' && yaHayInstructor))
                      .map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                  </AppSelect>
                </FormField>
                <FormField label="Usuario" style={{ flex: 2 }}>
                  <SearchableSelect
                    size="sm"
                    value={miembroForm.id_usuario}
                    placeholder="— Seleccionar usuario —"
                    options={usuariosDisponibles.map(u => ({ value: u.id, label: fmtNombre(u) }))}
                    onChange={v => setMiembroForm(p => ({ ...p, id_usuario: v }))}
                  />
                </FormField>
                <div style={{ marginBottom: 1 }}>
                  <AppButton size="compact" onClick={handleMiembroAgregar} loading={miembroSaving}>
                    Agregar
                  </AppButton>
                </div>
              </div>
              {usuariosDisponibles.length === 0 && !miembroSaving && (
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                  {miembroForm.rol_en_ficha === 'instructor'
                    ? 'No hay instructores disponibles para agregar.'
                    : 'No hay aprendices disponibles para agregar.'}
                </p>
              )}
            </div>
          )}

        </div>
      </AppModal>

      {isAdmin && <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar ficha"
        description={
          deleteTarget
            ? <>¿Eliminar la ficha <strong>{deleteTarget.codigo_ficha}</strong>? Esta acción no se puede deshacer.</>
            : null
        }
        confirmLabel="Sí, eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />}
    </div>
    </>
  )
}
