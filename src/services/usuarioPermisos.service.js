import api from './api'

export const usuarioPermisosService = {
  obtenerPorUsuario: (id_usuario) =>
    api.get(`/usuario-permisos/usuario/${id_usuario}`).then(r => r.data),

  asignar: (id_usuario, id_permiso, submodulos = []) =>
    api.post('/usuario-permisos', { id_usuario, id_permiso, submodulos }).then(r => r.data),

  actualizarSubmodulos: (id, submodulos) =>
    api.patch(`/usuario-permisos/${id}/submodulos`, { submodulos }).then(r => r.data),

  revocar: (id) =>
    api.delete(`/usuario-permisos/${id}`).then(r => r.data),
}
