import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { AppButton }     from '../../components/atoms/AppButton'
import { AppInput }      from '../../components/atoms/AppInput'
import { AppSelect }     from '../../components/atoms/AppSelect'
import { Badge }         from '../../components/atoms/Badge'
import { IconButton }    from '../../components/atoms/IconButton'
import { FormField }     from '../../components/molecules/FormField'
import { PageHeader }    from '../../components/molecules/PageHeader'
import { useToast }      from '../../hooks/useToast'
import { ConfirmDialog } from '../../components/molecules/ConfirmDialog'
import { AppModal }      from '../../components/organisms/AppModal'
import { DataTable }     from '../../components/organisms/DataTable'

import { MODULOS, SUBMODULOS, MODULO_LABELS, SUBMODULO_LABELS } from '../../constants/permisos.constants'
import { AppIcon }        from '../../components/atoms/AppIcon'
import { usePermissions } from '../../context/PermissionsContext'

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = { nombre: '', descripcion: '', modulo: 'estructura', submodulos: [] }

// ── Page ─────────────────────────────────────────────────────────────────────

export function PermisosPage() {
  const { hasAction } = usePermissions()
  const canCrear    = hasAction('administracion', 'permisos', 'crear')
  const canEditar   = hasAction('administracion', 'permisos', 'editar')
  const canEliminar = hasAction('administracion', 'permisos', 'eliminar')
  const [permisos,  setPermisos]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const [modal,     setModal]     = useState(null)  // null | { mode: 'create'|'edit', data? }
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const { showToast, toastPortal } = useToast()

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/permisos')
      setPermisos(data)
    } catch {
      setError('No se pudo cargar la información.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // ── Modal handlers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setModal({ mode: 'create' })
  }

  const openEdit = (p) => {
    setForm({ nombre: p.nombre, descripcion: p.descripcion, modulo: p.modulo, submodulos: p.submodulos ?? [] })
    setModal({ mode: 'edit', data: p })
  }

  const handleModuloChange = (e) => {
    set('modulo', e.target.value)
    set('submodulos', [])
  }

  const toggleSubmodulo = (value) => {
    setForm(prev => ({
      ...prev,
      submodulos: prev.submodulos.includes(value)
        ? prev.submodulos.filter(v => v !== value)
        : [...prev.submodulos, value],
    }))
  }

  const closeModal = () => { setModal(null) }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form }
      if (modal.mode === 'create') {
        await api.post('/permisos', payload)
        showToast('success', 'Permiso creado correctamente.')
      } else {
        await api.patch(`/permisos/${modal.data.id}`, payload)
        showToast('success', 'Permiso actualizado correctamente.')
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
      await api.delete(`/permisos/${deleteTarget.id}`)
      showToast('success', 'Permiso eliminado correctamente.')
      setDeleteTarget(null)
      loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
    } finally {
      setDeleting(false)
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'modulo',
      header: 'Módulo / Submódulo',
      render: (p) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Badge variant="success" style={{ fontSize: 11.5 }}>
            {MODULO_LABELS[p.modulo] ?? p.modulo}
          </Badge>
          {(p.submodulos ?? []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {p.submodulos.map(s => (
                <Badge key={s} variant="warning" style={{ fontSize: 10.5 }}>
                  {SUBMODULO_LABELS[s] ?? s}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ),
      width: 150,
    },
    {
      key: 'nombre',
      header: 'Nombre',
      render: (p) => <span style={{ fontWeight: 500, color: '#111827' }}>{p.nombre}</span>,
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (p) => <span style={{ color: '#6b7280' }}>{p.descripcion}</span>,
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 90,
      render: (p) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {canEditar && (
            <IconButton variant="edit" title="Editar" onClick={() => openEdit(p)}>
              <AppIcon name="edit" size={15} />
            </IconButton>
          )}
          {canEliminar && (
            <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(p)}>
              <AppIcon name="trash" size={15} />
            </IconButton>
          )}
        </div>
      ),
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {toastPortal}
      <div>
      <PageHeader
        title="Permisos"
        description="Gestión de permisos y módulos del sistema SIGMAT"
      />

      <DataTable
        columns={columns}
        data={permisos}
        loading={loading}
        error={error}
        onRetry={loadData}
        searchable
        searchPlaceholder="Buscar por nombre o módulo…"
        pageSize={10}
        emptyTitle="Sin permisos"
        emptyDescription="Crea el primer permiso del sistema."
        emptyAction={canCrear && (
          <AppButton size="compact" onClick={openCreate}>
            <AppIcon name="plus" /> Nuevo permiso
          </AppButton>
        )}
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <AppIcon name="refresh" /> Actualizar
            </AppButton>
            {canCrear && (
              <AppButton size="compact" onClick={openCreate}>
                <AppIcon name="plus" /> Nuevo permiso
              </AppButton>
            )}
          </>
        }
      />

      {/* Modal crear / editar */}
      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        maxWidth={640}
        title={modal?.mode === 'create' ? 'Nuevo permiso' : 'Editar permiso'}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={closeModal} disabled={saving}>
              Cancelar
            </AppButton>
            <AppButton size="compact" onClick={handleSave} loading={saving}>
              {modal?.mode === 'create' ? 'Crear permiso' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Módulo" required>
            <AppSelect
              size="sm"
              value={form.modulo}
              onChange={handleModuloChange}
            >
              {MODULOS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </AppSelect>
          </FormField>

          <FormField label="Submódulos (opcional)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 2 }}>
              {(SUBMODULOS[form.modulo] ?? []).map(s => {
                const selected = form.submodulos.includes(s.value)
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleSubmodulo(s.value)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 999,
                      border: `1.5px solid ${selected ? '#16a34a' : '#d1d5db'}`,
                      background: selected ? '#dcfce7' : '#f9fafb',
                      color: selected ? '#15803d' : '#4b5563',
                      fontSize: 12.5,
                      fontWeight: selected ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: 11.5, color: '#9ca3af', margin: '5px 0 0' }}>
              Sin selección = acceso a todo el módulo
            </p>
          </FormField>

          <FormField label="Nombre del permiso" required>
            <AppInput
              size="sm"
              value={form.nombre}
              placeholder="Ej. Gestión de Materiales"
              onChange={e => set('nombre', e.target.value)}
            />
          </FormField>

          <FormField label="Descripción" required>
            <AppInput
              size="sm"
              value={form.descripcion}
              placeholder="Ej. Acceso completo al módulo de materiales"
              onChange={e => set('descripcion', e.target.value)}
            />
          </FormField>

        </div>
      </AppModal>

      {/* Confirmar eliminación */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar permiso"
        description={
          deleteTarget
            ? <>¿Eliminar el permiso <strong>{deleteTarget.nombre}</strong>? Los roles que lo tengan asignado perderán este acceso.</>
            : null
        }
        confirmLabel="Sí, eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
    </>
  )
}
