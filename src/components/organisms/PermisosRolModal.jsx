import { useState, useEffect, useCallback } from 'react'
import { AppModal }            from './AppModal'
import { AppButton }           from '../atoms/AppButton'
import { useToast }            from '../../hooks/useToast'
import { ModuloPermisoToggle } from '../molecules/ModuloPermisoToggle'
import { rolPermisosService }  from '../../services/rolPermisos.service'
import { MODULOS }             from '../../constants/permisos.constants'

const MODULOS_GRANULARES = ['inventario', 'estructura', 'administracion', 'movimientos', 'control']

export function PermisosRolModal({ isOpen, onClose, rol, permisos, onSaved }) {
  // selecciones: { [id_permiso]: { enabled, submodulos, acciones, subAcciones, rows } }
  // `rows` guarda las filas reales (id, submodulo, acciones) tal como llegaron del backend,
  // necesarias para poder revocar/actualizar cada una individualmente al guardar.
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
        const rows = asignaciones.filter(a => a.id_permiso === p.id)
        const granular = MODULOS_GRANULARES.includes(p.modulo)
        if (granular) {
          // '' (módulo completo) es una opción explícita más dentro de subAcciones
          // (ver ModuloPermisoToggle → "Todo el módulo (sin restricción)").
          const subAcciones = {}
          for (const r of rows) subAcciones[r.submodulo] = r.acciones ?? []
          estado[p.id] = { enabled: rows.length > 0, subAcciones, rows }
        } else {
          const submodulos = rows.map(r => r.submodulo).filter(Boolean)
          estado[p.id] = { enabled: rows.length > 0, submodulos, acciones: rows[0]?.acciones ?? [], rows }
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

        const granular   = MODULOS_GRANULARES.includes(p.modulo)
        const wasEnabled = ori?.enabled ?? false
        const nowEnabled = cur.enabled

        if (!wasEnabled && !nowEnabled) continue

        if (wasEnabled && !nowEnabled) {
          await Promise.all((ori.rows ?? []).map(r => rolPermisosService.revocar(r.id)))
          continue
        }

        if (granular) {
          // '' (módulo completo) es solo una clave más de subAcciones (elegida explícitamente
          // vía su propio checkbox), así que el mismo diff genérico la maneja sin casos especiales.
          const subsAntes = ori?.subAcciones ?? {}
          const subsAhora = cur.subAcciones ?? {}
          const rowsPorSub = Object.fromEntries((ori?.rows ?? []).map(r => [r.submodulo, r]))

          // Submódulos quitados → revocar
          for (const sub of Object.keys(subsAntes)) {
            if (!(sub in subsAhora) && rowsPorSub[sub]) {
              await rolPermisosService.revocar(rowsPorSub[sub].id)
            }
          }
          // Submódulos nuevos o con acciones distintas → crear/actualizar
          for (const [sub, acciones] of Object.entries(subsAhora)) {
            const fila = rowsPorSub[sub]
            const cambiaron = JSON.stringify([...acciones].sort()) !== JSON.stringify([...(subsAntes[sub] ?? [])].sort())
            if (!fila) {
              await rolPermisosService.asignar(rol.id, p.id, sub, acciones)
            } else if (cambiaron) {
              await rolPermisosService.actualizar(fila.id, acciones)
            }
          }
        } else {
          const subsCambiaron =
            JSON.stringify([...(cur.submodulos ?? [])].sort()) !==
            JSON.stringify([...(ori?.submodulos ?? [])].sort())
          const accCambiaron =
            JSON.stringify([...(cur.acciones ?? [])].sort()) !==
            JSON.stringify([...(ori?.acciones ?? [])].sort())

          if (!wasEnabled && nowEnabled) {
            const subs = cur.submodulos.length > 0 ? cur.submodulos : ['']
            await Promise.all(subs.map(s => rolPermisosService.asignar(rol.id, p.id, s, cur.acciones)))
          } else if (subsCambiaron || accCambiaron) {
            // Reemplaza todas las filas del permiso: más simple y correcto que
            // diffear contra múltiples filas heredadas de una migración de datos.
            await Promise.all((ori.rows ?? []).map(r => rolPermisosService.revocar(r.id)))
            const subs = cur.submodulos.length > 0 ? cur.submodulos : ['']
            await Promise.all(subs.map(s => rolPermisosService.asignar(rol.id, p.id, s, cur.acciones)))
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

  // ── Manejador de cambio ───────────────────────────────────────────────────

  const handleChange = (permisoId, val) => {
    setSelecciones(prev => ({
      ...prev,
      [permisoId]: { ...prev[permisoId], ...val },
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
            const sel = selecciones[permiso.id] ?? { enabled: false, submodulos: [], acciones: [], subAcciones: {} }
            return (
              <ModuloPermisoToggle
                key={permiso.id}
                modulo={m.value}
                label={m.label}
                enabled={sel.enabled}
                submodulos={sel.submodulos}
                acciones={sel.acciones}
                subAcciones={sel.subAcciones}
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
