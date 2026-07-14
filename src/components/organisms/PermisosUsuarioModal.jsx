import { useState, useEffect, useCallback } from 'react'
import { AppModal }             from './AppModal'
import { AppButton }            from '../atoms/AppButton'
import { useToast }             from '../../hooks/useToast'
import { ModuloPermisoToggle }  from '../molecules/ModuloPermisoToggle'
import { usuarioPermisosService } from '../../services/usuarioPermisos.service'
import { MODULOS }              from '../../constants/permisos.constants'

export function PermisosUsuarioModal({ isOpen, onClose, usuario, permisos, onSaved }) {
  // selecciones: { [id_permiso]: { enabled, submodulos, assignmentId } }
  const [selecciones,  setSelecciones]  = useState({})
  const [original,     setOriginal]     = useState({})
  const [loading,      setLoading]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const { showToast, toastPortal } = useToast()

  // ── Carga las asignaciones actuales del usuario ───────────────────────────

  const loadAsignaciones = useCallback(async () => {
    if (!usuario?.id || !permisos.length) return
    setLoading(true)
    try {
      const asignaciones = await usuarioPermisosService.obtenerPorUsuario(usuario.id)

      const estado = {}
      for (const p of permisos) {
        const asig = asignaciones.find(a => a.id_permiso === p.id)
        estado[p.id] = {
          enabled:      !!asig,
          submodulos:   asig?.submodulos ?? [],
          assignmentId: asig?.id ?? null,
        }
      }
      setSelecciones(estado)
      setOriginal(estado)
    } catch {
      showToast('error', 'No se pudieron cargar los permisos actuales.')
    } finally {
      setLoading(false)
    }
  }, [usuario?.id, permisos])

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
          // Asignar nuevo permiso
          await usuarioPermisosService.asignar(usuario.id, p.id, cur.submodulos)
        } else if (wasEnabled && !nowEnabled) {
          // Revocar permiso
          await usuarioPermisosService.revocar(ori.assignmentId)
        } else if (wasEnabled && nowEnabled) {
          // Actualizar submódulos si cambiaron
          const subsCambiaron =
            JSON.stringify([...cur.submodulos].sort()) !==
            JSON.stringify([...(ori.submodulos ?? [])].sort())
          if (subsCambiaron) {
            await usuarioPermisosService.actualizarSubmodulos(ori.assignmentId, cur.submodulos)
          }
        }
      }
      // El toast se dispara desde el padre: este modal se desmonta al cerrar
      // (onClose), y un toast local montado aquí nunca alcanza a pintarse.
      onSaved?.()
      onClose()
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar los permisos.'))
    } finally {
      setSaving(false)
    }
  }

  // ── Manejador de cambio por módulo ────────────────────────────────────────

  const handleChange = (permisoId, { enabled, submodulos }) => {
    setSelecciones(prev => ({
      ...prev,
      [permisoId]: { ...prev[permisoId], enabled, submodulos },
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
      maxWidth={640}
      title={
        usuario
          ? `Permisos — ${usuario.nombres} ${usuario.apellidos}`
          : 'Permisos de usuario'
      }
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

          <div className="mb-1">
            <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
              Activa los módulos y elige submódulos específicos. Sin submódulos marcados = acceso completo al módulo.
            </p>
            {totalActivos > 0 && (
              <p className="mb-0 fw-500 mt-1" style={{ fontSize: 12, color: '#16a34a' }}>
                {totalActivos} {totalActivos === 1 ? 'módulo activo' : 'módulos activos'}
              </p>
            )}
          </div>

          {/* Un toggle por módulo */}
          {MODULOS.map(m => {
            const permiso = getPermisoByModulo(m.value)
            if (!permiso) return null
            const sel = selecciones[permiso.id] ?? { enabled: false, submodulos: [] }
            return (
              <ModuloPermisoToggle
                key={permiso.id}
                modulo={m.value}
                label={m.label}
                enabled={sel.enabled}
                submodulos={sel.submodulos}
                subAcciones={Object.fromEntries((sel.submodulos ?? []).map(s => [s, []]))}
                showAcciones={false}
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
