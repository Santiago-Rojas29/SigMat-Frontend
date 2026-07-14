export const MODULOS = [
  { value: 'estructura',     label: 'Estructura' },
  { value: 'administracion', label: 'Administración' },
  { value: 'inventario',     label: 'Inventario' },
  { value: 'movimientos',    label: 'Movimientos' },
  { value: 'control',        label: 'Control y Seguimiento' },
]

export const SUBMODULOS = {
  estructura: [
    { value: 'centros',   label: 'Centros' },
    { value: 'sedes',     label: 'Sedes' },
    { value: 'areas',     label: 'Áreas' },
    { value: 'programas', label: 'Programas' },
    { value: 'fichas',    label: 'Fichas' },
  ],
  administracion: [
    { value: 'usuarios', label: 'Usuarios' },
    { value: 'roles',    label: 'Roles' },
    { value: 'permisos', label: 'Permisos' },
  ],
  inventario: [
    { value: 'materiales',  label: 'Materiales' },
    { value: 'lotes',       label: 'Lotes' },
    { value: 'unidades',    label: 'Unidades' },
    { value: 'ubicaciones', label: 'Ubicaciones' },
  ],
  movimientos: [
    { value: 'catalogo',    label: 'Catálogo' },
    { value: 'solicitudes', label: 'Solicitudes' },
    { value: 'prestamos',   label: 'Préstamos' },
  ],
  control: [
    { value: 'traslados',   label: 'Traslados' },
    { value: 'incidencias', label: 'Incidencias' },
    { value: 'kardex',      label: 'Kardex' },
  ],
}

// ── Acciones globales (aplican a todos los módulos) ────────────────────────────
export const ACCIONES_GLOBALES = [
  { value: 'ver',      label: 'Ver' },
  { value: 'crear',    label: 'Crear' },
  { value: 'editar',   label: 'Editar' },
  { value: 'eliminar', label: 'Eliminar' },
]

// ── Acciones adicionales específicas por módulo ────────────────────────────────
export const ACCIONES_EXTRA = {
  movimientos: [
    { value: 'solicitar', label: 'Solicitar' },
    { value: 'aprobar',   label: 'Aprobar'   },
    { value: 'rechazar',  label: 'Rechazar'  },
    { value: 'prestar',   label: 'Prestar'   },
    { value: 'entregar',  label: 'Entregar'  },
    { value: 'devolver',  label: 'Devolver'  },
  ],
  inventario: [
    { value: 'ajustar_stock', label: 'Ajustar stock' },
  ],
  control: [
    { value: 'generar_reporte', label: 'Generar reporte' },
  ],
}

// ── Helpers de etiquetas ───────────────────────────────────────────────────────
export const MODULO_LABELS    = Object.fromEntries(MODULOS.map(m => [m.value, m.label]))
export const SUBMODULO_LABELS = Object.fromEntries(
  Object.entries(SUBMODULOS).flatMap(([, subs]) => subs.map(s => [s.value, s.label]))
)
