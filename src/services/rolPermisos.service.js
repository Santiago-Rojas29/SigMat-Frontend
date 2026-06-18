import api from './api'

export const rolPermisosService = {
  obtenerPorRol: (id_rol) =>
    api.get(`/rol-permisos/rol/${id_rol}`).then(r => r.data),

  asignar: (id_rol, id_permiso, submodulos = [], acciones = []) =>
    api.post('/rol-permisos', { id_rol, id_permiso, submodulos, acciones }).then(r => r.data),

  actualizar: (id, submodulos, acciones) =>
    api.patch(`/rol-permisos/${id}`, { submodulos, acciones }).then(r => r.data),

  revocar: (id) =>
    api.delete(`/rol-permisos/${id}`).then(r => r.data),
}
