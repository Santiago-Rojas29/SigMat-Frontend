import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { AppButton }     from '../../components/atoms/AppButton'
import { AppInput }      from '../../components/atoms/AppInput'
import { Badge }         from '../../components/atoms/Badge'
import { IconButton }    from '../../components/atoms/IconButton'
import { FormField }     from '../../components/molecules/FormField'
import { PageHeader }    from '../../components/molecules/PageHeader'
import { AlertBanner }   from '../../components/molecules/AlertBanner'
import { ConfirmDialog } from '../../components/molecules/ConfirmDialog'
import { AppModal }      from '../../components/organisms/AppModal'
import { DataTable }     from '../../components/organisms/DataTable'

// ── Icons ─────────────────────────────────────────────────────────────────────

function Ic({ size = 16, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const PlusIcon    = () => <Ic><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ic>
const RefreshIcon = () => <Ic><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></Ic>
const EditIcon    = () => <Ic size={15}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Ic>
const TrashIcon   = () => <Ic size={15}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></Ic>

// ── Constantes ────────────────────────────────────────────────────────────────

const MODULO_LABELS = {
  materiales:  { label: 'Materiales',  desc: 'Materiales, lotes y unidades del almacén' },
  prestamos:   { label: 'Préstamos',   desc: 'Solicitudes y préstamos de materiales' },
  inventario:  { label: 'Inventario',  desc: 'Traslados, incidencias y kardex' },
  usuarios:    { label: 'Usuarios',    desc: 'Gestión de usuarios y roles del sistema' },
  ubicaciones: { label: 'Ubicaciones', desc: 'Ubicaciones físicas del almacén' },
}

const EMPTY_FORM = { nombre: '', descripcion: '' }

// ── Page ──────────────────────────────────────────────────────────────────────

export function RolesPage() {
  const [roles,    setRoles]    = useState([])
  const [permisos, setPermisos] = useState([])   // lista de permisos de la BD
  const [rolPerms, setRolPerms] = useState([])   // tabla rol_permisos completa
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const [modal,     setModal]     = useState(null)   // null | { mode: 'create'|'edit', data? }
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [checked,   setChecked]   = useState([])     // ids de permisos marcados
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  // ── Carga de datos ────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rRes, pRes, rpRes] = await Promise.all([
        api.get('/rol'),
        api.get('/permisos'),
        api.get('/rol-permisos'),
      ])
      setRoles(rRes.data)
      setPermisos(pRes.data)
      setRolPerms(rpRes.data)
    } catch {
      setError('No se pudo cargar la información.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Devuelve los módulos asignados a un rol (para mostrar en la tabla)
  const modulosDeRol = (id_rol) => {
    const idsPermiso = rolPerms
      .filter(rp => rp.id_rol === id_rol)
      .map(rp => rp.id_permiso)
    return permisos
      .filter(p => idsPermiso.includes(p.id))
      .map(p => p.modulo)
  }

  const togglePermiso = (id) =>
    setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  // ── Abrir modales ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setChecked([])
    setFormError(null)
    setModal({ mode: 'create' })
  }

  const openEdit = (rol) => {
    setForm({ nombre: rol.nombre, descripcion: rol.descripcion })
    // Pre-marcar los permisos que ya tiene este rol
    const actuales = rolPerms
      .filter(rp => rp.id_rol === rol.id)
      .map(rp => rp.id_permiso)
    setChecked(actuales)
    setFormError(null)
    setModal({ mode: 'edit', data: rol })
  }

  const closeModal = () => { setModal(null); setFormError(null) }

  // ── Guardar ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      setFormError('El nombre del rol es obligatorio.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      let rolId

      if (modal.mode === 'create') {
        // 1. Crear el rol
        const { data } = await api.post('/rol', form)
        rolId = data.id
        // 2. Asignar todos los permisos marcados
        await Promise.all(
          checked.map(id_permiso =>
            api.post('/rol-permisos', { id_rol: rolId, id_permiso })
          )
        )
      } else {
        // 1. Actualizar datos del rol
        rolId = modal.data.id
        await api.patch(`/rol/${rolId}`, form)
        // 2. Asignar solo los permisos NUEVOS (los que no tenía antes)
        const anteriores = rolPerms
          .filter(rp => rp.id_rol === rolId)
          .map(rp => rp.id_permiso)
        const nuevos = checked.filter(id => !anteriores.includes(id))
        await Promise.all(
          nuevos.map(id_permiso =>
            api.post('/rol-permisos', { id_rol: rolId, id_permiso })
          )
        )
      }

      closeModal()
      loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar.'))
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/rol/${deleteTarget.id}`)
      setDeleteTarget(null)
      loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      alert(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
    } finally {
      setDeleting(false)
    }
  }

  // ── Columnas de la tabla ──────────────────────────────────────────────────

  const columns = [
    {
      key: 'nombre',
      header: 'Rol',
      render: (r) => <span style={{ fontWeight: 600, color: '#111827' }}>{r.nombre}</span>,
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (r) => <span style={{ color: '#6b7280' }}>{r.descripcion}</span>,
    },
    {
      key: 'accesos',
      header: 'Accesos',
      render: (r) => {
        const mods = modulosDeRol(r.id)
        if (mods.length === 0)
          return <span style={{ color: '#9ca3af', fontSize: 13 }}>Sin accesos</span>
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {mods.map(m => (
              <Badge key={m} variant="success" style={{ fontSize: 11 }}>
                {MODULO_LABELS[m]?.label ?? m}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 90,
      render: (r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton variant="edit" title="Editar" onClick={() => openEdit(r)}>
            <EditIcon />
          </IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(r)}>
            <TrashIcon />
          </IconButton>
        </div>
      ),
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Crea roles y define a qué módulos tienen acceso"
      />

      <DataTable
        columns={columns}
        data={roles}
        loading={loading}
        error={error}
        onRetry={loadData}
        searchable
        searchPlaceholder="Buscar por nombre…"
        pageSize={10}
        emptyTitle="Sin roles"
        emptyDescription="Crea el primer rol del sistema."
        emptyAction={
          <AppButton size="compact" onClick={openCreate}>
            <PlusIcon /> Nuevo rol
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <RefreshIcon /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <PlusIcon /> Nuevo rol
            </AppButton>
          </>
        }
      />

      {/* ── Modal crear / editar ────────────────────────────────────────────── */}
      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        title={modal?.mode === 'create' ? 'Nuevo rol' : `Editar — ${modal?.data?.nombre ?? ''}`}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={closeModal} disabled={saving}>
              Cancelar
            </AppButton>
            <AppButton size="compact" onClick={handleSave} loading={saving}>
              {modal?.mode === 'create' ? 'Crear rol' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Datos básicos */}
          <FormField label="Nombre del rol" required>
            <AppInput
              size="sm"
              value={form.nombre}
              placeholder="Ej. Instructor"
              onChange={e => set('nombre', e.target.value)}
            />
          </FormField>

          <FormField label="Descripción" required>
            <AppInput
              size="sm"
              value={form.descripcion}
              placeholder="Ej. Gestiona préstamos y materiales del SENA"
              onChange={e => set('descripcion', e.target.value)}
            />
          </FormField>

          {/* Separador */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
              Módulos con acceso
            </p>

            {/* Checkboxes de permisos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {permisos.map(p => {
                const isChecked = checked.includes(p.id)
                const info = MODULO_LABELS[p.modulo] ?? { label: p.modulo, desc: p.descripcion }
                return (
                  <label
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${isChecked ? '#39A900' : '#e5e7eb'}`,
                      background: isChecked ? 'rgba(57,169,0,0.05)' : '#fafafa',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermiso(p.id)}
                      style={{ accentColor: '#39A900', width: 16, height: 16, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 13.5, color: '#111827' }}>
                        {info.label}
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
                        {info.desc}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {formError && <AlertBanner variant="error">{formError}</AlertBanner>}
        </div>
      </AppModal>

      {/* ── Confirmar eliminación ───────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar rol"
        description={
          deleteTarget
            ? <>¿Eliminar el rol <strong>{deleteTarget.nombre}</strong>? Los usuarios con este rol perderán su asignación.</>
            : null
        }
        confirmLabel="Sí, eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
