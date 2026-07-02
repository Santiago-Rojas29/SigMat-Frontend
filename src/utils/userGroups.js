const ROLE_ORDER  = ['Administrador', 'Responsable de Bodega', 'Instructor', 'Aprendiz']
const ROLE_PLURAL = {
  'Administrador':         'Administradores',
  'Responsable de Bodega': 'Responsables de Bodega',
  'Instructor':            'Instructores',
  'Aprendiz':              'Aprendices',
}

/**
 * Agrupa un array de usuarios por rol para usarlo en SearchableSelect.
 * Cada grupo aparece como { isGroup: true, label } seguido de sus usuarios.
 * @param {Array} usuarios  - array de objetos con { id, nombres, apellidos, id_rol }
 * @param {Array} roles     - array de objetos con { id, nombre }
 */
export function groupUsersByRole(usuarios, roles) {
  const roleMap = Object.fromEntries(roles.map(r => [r.id, r.nombre]))
  const groups  = {}

  for (const u of usuarios) {
    const rName = roleMap[u.id_rol] ?? 'Otros'
    if (!groups[rName]) groups[rName] = []
    groups[rName].push(u)
  }

  const result  = []
  const handled = new Set()

  for (const rName of ROLE_ORDER) {
    if (!groups[rName]?.length) continue
    result.push({ isGroup: true, label: ROLE_PLURAL[rName] ?? rName })
    for (const u of [...groups[rName]].sort((a, b) =>
      `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`, 'es')
    )) {
      result.push({ value: u.id, label: `${u.nombres} ${u.apellidos}`.trim() })
    }
    handled.add(rName)
  }

  for (const [rName, users] of Object.entries(groups)) {
    if (handled.has(rName)) continue
    result.push({ isGroup: true, label: rName })
    for (const u of users) {
      result.push({ value: u.id, label: `${u.nombres} ${u.apellidos}`.trim() })
    }
  }

  return result
}
