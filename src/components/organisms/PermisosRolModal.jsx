import { useState, useEffect, useCallback } from 'react'
import { AppModal }            from './AppModal'
import { AppButton }           from '../atoms/AppButton'
import { useToast }            from '../../hooks/useToast'
import { ModuloPermisoToggle } from '../molecules/ModuloPermisoToggle'
import { rolPermisosService }  from '../../services/rolPermisos.service'
import { MODULOS }             from '../../constants/permisos.constants'

export function PermisosRolModal({ isOpen, onClose, rol, permisos }) {
  // selecciones: { [id_permiso]: { enabled, submodulos, acciones, assignmentId } }
  const [selecciones, setSelecciones] = useState({})
  const [original,    setOriginal]    = useState({})
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const { showToast, toastPortal } = useToast()

  // ── Carga asignaciones actuales del rol ───────────────────────────────────

  const loadAsignaciones = useCallback(async () => {
    if (!rol?.id || !permisos.length) return
    setLoading(true)
    try {
      const asignaciones = await rolPermisosService.obtenerPorRol(rol.id)
      const estado = {}
      for (const p of permisos) {
        const asig = asignaciones.find(a => a.id_permiso === p.id)
        estado[p.id] = {
          enabled:      !!asig,
          submodulos:   asig?.submodulos ?? [],
          acciones:     asig?.acciones   ?? [],
          assignmentId: asig?.id         ?? null,
        }
      }
      setSelecciones(estado)
      setOriginal(estado)
    } catch {
      showToast('error', 'No se pudieron cargar los permisos actuales.')
    } finally {
      setLoading(false)
    }
  }, [rol?.id, permisos])

  useEffect(() => {
    if (isOpen) loadAsignaciones()
  }, [isOpen, loadAsignaciones])

  // ── Guardar cambios ───────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const p of permisos) {
        const cur = selecciones[p.id]
        const ori = original[p.id]
        if (!cur) continue

        const wasEnabled = ori?.enabled ?? false
        const nowEnabled = cur.enabled

        if (!wasEnabled && nowEnabled) {
          await rolPermisosService.asignar(rol.id, p.id, cur.submodulos, cur.acciones)
        } else if (wasEnabled && !nowEnabled) {
          await rolPermisosService.revocar(ori.assignmentId)
        } else if (wasEnabled && nowEnabled) {
          const subsCambiaron =
            JSON.stringify([...cur.submodulos].sort()) !==
            JSON.stringify([...(ori.submodulos ?? [])].sort())
          const accCambiaron =
            JSON.stringify([...cur.acciones].sort()) !==
            JSON.stringify([...(ori.acciones ?? [])].sort())
          if (subsCambiaron || accCambiaron) {
            await rolPermisosService.actualizar(ori.assignmentId, cur.submodulos, cur.acciones)
          }
        }
      }
      onClose()
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar los permisos.'))
    } finally {
      setSaving(false)
    }
  }

  // ── Manejador de cambio ───────────────────────────────────────────────────

  const handleChange = (permisoId, { enabled, submodulos, acciones }) => {
    setSelecciones(prev => ({
      ...prev,
      [permisoId]: { ...prev[permisoId], enabled, submodulos, acciones },
    }))
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const totalActivos = Object.values(selecciones).filter(s => s.enabled).length

  const getPermisoByModulo = (moduloValue) =>
    permisos.find(p => p.modulo === moduloValue)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={660}
      title={rol ? `Permisos del rol — ${rol.nombre}` : 'Permisos del rol'}
      footer={
        <>
          <AppButton variant="ghost" size="compact" onClick={onClose} disabled={saving}>
            Cancelar
          </AppButton>
          <AppButton size="compact" onClick={handleSave} loading={saving} disabled={loading}>
            Guardar permisos
          </AppButton>
        </>
      }
    >
      {loading ? (
        <div className="text-center text-secondary py-5" style={{ fontSize: 13.5 }}>
          Cargando permisos…
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">

          {/* Cabecera informativa */}
          <div className="mb-1">
            <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
              Activa los módulos, elige submódulos específicos y selecciona qué acciones
              puede realizar este rol. Todos los usuarios con este rol heredarán estos permisos.
            </p>
            {totalActivos > 0 && (
              <p className="mb-0 fw-600 mt-1" style={{ fontSize: 12, color: '#16a34a' }}>
                {totalActivos} {totalActivos === 1 ? 'módulo activo' : 'módulos activos'}
              </p>
            )}
          </div>

          {/* Toggle por módulo */}
          {MODULOS.map(m => {
            const permiso = getPermisoByModulo(m.value)
            if (!permiso) return null
            const sel = selecciones[permiso.id] ?? { enabled: false, submodulos: [], acciones: [] }
            return (
              <ModuloPermisoToggle
                key={permiso.id}
                modulo={m.value}
                label={m.label}
                enabled={sel.enabled}
                submodulos={sel.submodulos}
                acciones={sel.acciones}
                onChange={(val) => handleChange(permiso.id, val)}
              />
            )
          })}

          {toastPortal}
        </div>
      )}
    </AppModal>
  )
}
