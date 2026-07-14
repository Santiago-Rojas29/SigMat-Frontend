import api from './api'

export const rolPermisosService = {
  obtenerPorRol: (id_rol) =>
    api.get(`/rol-permisos/rol/${id_rol}`).then(r => r.data),

  asignar: (id_rol, id_permiso, submodulo = '', acciones = []) =>
    api.post('/rol-permisos', { id_rol, id_permiso, submodulo, acciones }).then(r => r.data),

  actualizar: (id, acciones) =>
    api.patch(`/rol-permisos/${id}`, { acciones }).then(r => r.data),

  revocar: (id) =>
    api.delete(`/rol-permisos/${id}`).then(r => r.data),
}
