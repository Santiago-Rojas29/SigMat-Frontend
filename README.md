# SigMat — Frontend

Interfaz web de SIGMAT (Sistema de Gestión de Materiales), construida con React 19 + TypeScript + Vite.

## Requisitos

- Node.js 18+
- El backend corriendo (ver `SigMat-Backend/README.md`) — este proyecto no tiene contenedor propio ni base de datos, solo consume la API.

## 1. Variables de entorno

Crea un archivo `.env` en la raíz de `SigMat-Frontend/` con estas claves:

```env
# URL base de la API del backend
VITE_API_URL=http://localhost:3000/api

# URL del webhook de n8n que alimenta el chat de ayuda (ChatWidget)
VITE_N8N_CHAT_URL=https://tu-instancia-n8n.com/webhook/...
```

## 2. Instalar dependencias y correr

```bash
npm install
npm run dev
```

Por defecto queda disponible en `http://localhost:5173`. Ese puerto (junto con `4200`/`4201` para la versión Angular) ya está permitido en el CORS del backend por defecto — si usas otro puerto, agrégalo a `FRONTEND_URL` en el `.env` del backend.

## Qué necesitas saber para entrar al sistema

No hay ningún seed ni registro propio en el frontend: el primer usuario para iniciar sesión es el **Root**, que el backend crea automáticamente la primera vez que arranca (`root@sigmat.com` / `Sigmat2024*` por defecto, ver README del backend). Desde ahí, con el Root logueado, se crean los centros, sedes y administradores de cada sede.

## Lo más importante

- **Multitenant por sede**: lo que ve cada usuario (menús, datos, permisos) depende de su rol y de su `id_sede`, que viaja en el JWT. El rol Root es el único que ve todas las sedes a la vez (dashboard y gestión de centros/sedes/admins).
- **Permisos por módulo**: la navegación y las acciones disponibles (crear/editar/eliminar/aprobar/etc.) se ajustan según los permisos que el rol del usuario tenga en cada módulo (Estructura, Administración, Inventario, Movimientos, Control).
- **Notificaciones en tiempo real**: conexión WebSocket (`socket.io-client`) para la campana de notificaciones — préstamos vencidos, solicitudes pendientes, stock crítico, etc.
- **Reportes en PDF**: los reportes se generan en el navegador con `@react-pdf/renderer`, con plantillas con el diseño institucional SENA.
- **Chat de ayuda**: `ChatWidget` habla con un flujo de n8n vía `VITE_N8N_CHAT_URL`.

## Scripts

```bash
npm run dev       # servidor de desarrollo (Vite + HMR)
npm run build     # type-check (tsc -b) + build de producción
npm run preview   # sirve el build de producción localmente
npm run lint      # ESLint
```
