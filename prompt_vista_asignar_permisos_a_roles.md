# Prompt: Vista "Asignar Permisos a Roles" (SportManager)

> Copia todo lo que está debajo de la línea y pégalo en tu asistente de código (Claude Code, Cursor, etc.) con el repositorio abierto.

---

## Rol y objetivo

Actúa como desarrollador full-stack senior. Debes implementar la vista **"Asignar Permisos a Roles"** de la plataforma administrativa **SportManager** (sistema de gestión de torneos deportivos), junto con la protección de acceso que la rodea: **guardianes (guards) e interceptores (interceptors)** para que SOLO los usuarios con permisos de administración puedan ver y usar esta vista y sus endpoints. Quien no tenga el permiso no debe poder verla, ni navegar a ella, ni ejecutar sus operaciones en el backend.

Se adjunta un mockup de la pantalla (tema oscuro, acentos verde neón y cian). Impleméntalo fielmente en estructura y funcionalidad, **pero adaptándolo al estilo, componentes, convenciones y librerías que ya existen en el frontend React del proyecto.**

## Paso 0 — Reconocimiento (obligatorio antes de escribir código)

No asumas nada del proyecto. Primero explora el repositorio y resume brevemente lo que encuentres:

1. **Frontend (React):** estructura de carpetas, enrutador (react-router u otro), librería de estilos (Tailwind, CSS Modules, MUI, styled-components, etc.), componentes reutilizables existentes (botones, inputs, selects, modales, alertas/toasts, tablas, layout con sidebar), gestor de estado (Context, Redux, Zustand…), cliente HTTP (axios/fetch), manejo actual del token/sesión y de los formularios de login y sign up.
2. **Backend:** framework y lenguaje (por la terminología de guards/interceptors es probable NestJS, pero verifícalo), cómo se implementó la autenticación (JWT, sesiones en BD con token y fecha de expiración), entidades y tablas existentes de **Usuario, Rol, Permiso, UsuarioRol (usuario_rol) y RolPermiso (rol_permiso)**, y cómo se asigna por defecto el rol **Aficionado** al registrarse.
3. Qué endpoints de seguridad ya existen (usuarios, roles, permisos, `me`, login, logout) para **reutilizarlos y no duplicarlos**.

Con base en eso, haz un plan corto (archivos a crear/modificar) y luego implementa. Si algo crítico es ambiguo, pregunta antes de inventar.

## Contexto del modelo de seguridad (ya implementado en BD)

- Autorización basada en **permisos asignados a roles** y **roles asignados a usuarios**, mediante **tablas intermedias** (relación muchos a muchos en ambos casos).
- Un usuario puede tener varios roles; un rol puede tener varios permisos; un permiso puede pertenecer a varios roles.
- **Permisos efectivos de un usuario = unión de los permisos de todos sus roles.** Si al menos uno de sus roles posee el permiso, la operación se permite; si ninguno lo posee, se deniega.
- Un permiso identifica: recurso/módulo/modelo, operación que autoriza (Ver, Listar, Crear, Actualizar, Eliminar), URL y método HTTP.
- Roles existentes de referencia: Administrador, Coordinador, Operador, Consulta, Juez Deportivo y Aficionado (rol por defecto al registrarse).
- No se permite duplicar la asociación rol–permiso ni usuario–rol.
- Retirar un permiso de un rol **no elimina el permiso del sistema**; eliminar un rol/permiso no elimina usuarios ni los demás elementos.
- Los cambios aplican a **todos los usuarios que tengan ese rol** y deben persistir tras cerrar e iniciar sesión nuevamente.

## Parte 1 — Backend: guardianes e interceptores

1. **Guard de autenticación:** valida que la sesión/token sea válido y no esté expirado ni cerrado. Respuesta `401` si no.
2. **Guard de autorización por permisos** (decorador tipo `@RequirePermissions('roles:actualizar')` o el equivalente que encaje con el framework y con cómo están modelados los permisos en BD):
   - Carga los roles del usuario y sus permisos, calcula la unión y decide.
   - Respuesta `403` si ninguno de sus roles tiene el permiso.
   - Evita N+1 consultas (una consulta con joins o caché corta por usuario, con invalidación al cambiar permisos/roles).
3. **Interceptor(es):** usa interceptores donde aporten valor real, por ejemplo: adjuntar el usuario y sus permisos efectivos al request, normalizar el formato de respuestas/errores y registrar en auditoría las operaciones de cambio de permisos (quién, rol afectado, permisos agregados/retirados, fecha). No los metas por obligación si no aportan.
4. **Endpoints necesarios** (reutiliza los existentes; crea solo los que falten; ajusta rutas a la convención del proyecto):
   - `GET /roles` → listado de roles (id, nombre, estado) para el selector.
   - `GET /permissions` → catálogo de permisos disponibles, **agrupados por módulo y recurso**, con sus operaciones.
   - `GET /roles/:id/permissions` → permisos actualmente asignados al rol.
   - `GET /roles/:id/summary` → usuarios asociados, total de permisos asignados, módulos con acceso, total disponibles, no asignados.
   - `PUT /roles/:id/permissions` → recibe la lista completa de ids de permisos que debe quedar asignada al rol y sincroniza (agrega los nuevos, retira los desmarcados) **dentro de una transacción**, sin duplicados, devolviendo el estado final.
   - `GET /auth/me` (o equivalente) → usuario autenticado con sus roles y **permisos efectivos**, para que el frontend pueda decidir qué mostrar.
5. Todos los endpoints anteriores deben estar protegidos con ambos guards y el permiso adecuado (ver, listar, actualizar sobre el recurso *Roles*/*Permisos*).
6. **Reglas de seguridad de negocio:**
   - Un usuario no puede quitarse a sí mismo (vía su rol) los permisos que lo dejarían sin acceso a la gestión de roles/permisos (evitar bloqueo total del sistema). Valida en backend y devuelve un error claro.
   - Si se invalida/cambia el set de permisos de un rol, los usuarios afectados deben ver el efecto en su siguiente petición (invalidar caché de permisos).
7. Validaciones con DTOs (ids existentes, sin duplicados, rol existente) y códigos HTTP coherentes (400, 401, 403, 404, 409).

## Parte 2 — Frontend: protección de acceso (React)

1. **Estado de autorización:** al iniciar sesión (y al recargar la página con sesión vigente) obtener `me` con roles y permisos efectivos y guardarlos en el gestor de estado/contexto que ya use el proyecto. Exponer un hook, por ejemplo `usePermissions()` / `useAuth()` con `hasPermission(recurso, operación)` y `hasRole(nombre)`.
2. **Route guard** (componente tipo `<ProtectedRoute requiredPermissions={[...]} />` o el patrón que ya use el router del proyecto):
   - Sin sesión → redirigir a login (guardando la ruta de destino).
   - Con sesión pero sin permiso → página **403 / "Acceso denegado"** (o redirección al dashboard con aviso), nunca mostrar la vista.
   - Aplicarlo a la ruta de esta vista (p. ej. `/roles/:id/permisos` o la que corresponda) y a las demás rutas de administración del módulo de seguridad.
3. **Interceptor HTTP** (axios interceptors o wrapper de fetch, según el cliente existente):
   - Request: adjuntar el token de sesión.
   - Response `401`: limpiar sesión y redirigir a login.
   - Response `403`: mostrar aviso de acceso denegado sin romper la app (y, si procede, refrescar los permisos con `me` por si cambiaron).
4. **Navegación condicionada:** en el sidebar (Dashboard, Usuarios, Roles, Permisos, Seguridad, Auditoría) ocultar los ítems para los que el usuario no tiene permiso. Un usuario con solo el rol Aficionado no debe ver las opciones de administración.
5. **Importante:** la protección del frontend es solo UX. La seguridad real está en los guards del backend; verifica que ambos estén alineados.

## Parte 3 — Frontend: la vista "Asignar Permisos a Roles"

Reproduce la estructura del mockup:

**Encabezado de página:** título "Asignar Permisos a Roles" y subtítulo "Administra de manera centralizada los permisos que puede ejecutar cada rol del sistema."

**Barra de acciones (tarjeta superior):**
- Selector **"Rol seleccionado"** (dropdown con el rol activo marcado con check; lista cargada del backend).
- Botón **"Cargar permisos"**: carga/recarga desde el servidor los permisos del rol seleccionado (si en el repo ya hay una convención distinta para este caso, adáptala y explícalo).
- Botón primario **"Guardar cambios"**: envía el set final al `PUT /roles/:id/permissions`. Deshabilitado si no hay cambios pendientes; con estado de carga mientras guarda.
- Botón **"Restablecer"**: descarta los cambios locales y vuelve al último estado guardado.
- Mensaje de éxito descartable: "Permisos actualizados correctamente." (usar el sistema de alertas/toasts del proyecto) y mensaje informativo: "Los permisos seleccionados se conservarán después de cerrar e iniciar sesión nuevamente."

**Matriz de permisos del rol:**
- Columnas: Recurso | Ver | Listar | Crear | Actualizar | Eliminar.
- Filas agrupadas por módulo, con grupos colapsables. Módulos y recursos del mockup:
  - Administración: Usuarios, Roles, Permisos
  - Gestión Deportiva: Torneos, Equipos, Jugadores, Partidos
  - Comercial: Entradas
  - Infraestructura: Escenarios
  - Reportes: Reportes
- **No quemes esta lista en el frontend:** constrúyela dinámicamente a partir del catálogo de permisos del backend. Si una combinación recurso–operación no existe en el catálogo, la celda no debe poder marcarse (mostrarla deshabilitada o vacía).
- Cada celda es un checkbox: marcar = asignar, desmarcar = retirar. Al cambiar de rol, la matriz muestra marcados **únicamente** los permisos que ese rol tiene actualmente.
- Opcional si encaja con el estilo del proyecto: checkbox de "seleccionar toda la fila" / "toda la columna" / "todo el módulo".
- Los cambios son **locales hasta pulsar "Guardar cambios"**. Si el usuario intenta cambiar de rol o salir con cambios sin guardar, pedir confirmación.

**Panel lateral "Resumen del rol"** (se actualiza al cambiar de rol y tras guardar):
- Nombre del rol y estado (Activo/Inactivo).
- Usuarios asociados, Total de permisos asignados, Módulos con acceso.
- Tarjetas: Total de permisos disponibles | Asignados | No asignados.
- **Leyenda:** permiso asignado / no asignado.
- **Reglas de acceso:** (1) si al menos uno de los roles del usuario posee el permiso, la operación se permite; (2) si ninguno lo posee, se deniega; (3) los cambios aplican a todos los usuarios con este rol.
- Aviso en rojo/advertencia: "Retirar un permiso del rol no elimina el permiso del sistema."
- Los contadores del panel deben reflejar también los cambios locales no guardados (o indicar claramente que muestran el estado guardado; elige una opción y sé consistente).

**Estados de la UI:** cargando (skeleton o spinner del proyecto), error al cargar (con reintento), éxito, error al guardar (mantener los cambios locales y mostrar el motivo), rol sin permisos, y acceso denegado (403).

**Accesibilidad y responsive:** checkboxes con labels accesibles (`aria-label` del tipo "Crear Torneos"), navegación por teclado, y comportamiento razonable en pantallas más pequeñas (scroll horizontal de la matriz si hace falta).

## Parte 4 — Estilo y consistencia (crítico)

- Reutiliza el layout (sidebar + header con usuario y notificaciones), tokens de color, tipografía, espaciados, botones, selects, alertas y checkboxes que ya existan. **No instales nuevas librerías de UI** ni introduzcas otro sistema de estilos sin preguntarme.
- El mockup es la referencia de composición y jerarquía visual; la referencia de **estilo real** es el código existente. Si hay diferencias entre ambos, gana el estilo ya implementado en el proyecto.
- Sigue las convenciones de nombres, estructura de carpetas, manejo de formularios, llamadas a la API y tipado (TypeScript si el proyecto lo usa).
- Separa responsabilidades: componentes de presentación (`PermissionMatrix`, `RoleSelector`, `RoleSummaryPanel`), hook de datos (`useRolePermissions`) y servicio de API.

## Criterios de aceptación (verifica cada uno al terminar)

- [ ] Un usuario sin sesión que entra a la ruta es redirigido a login.
- [ ] Un usuario con solo rol Aficionado no ve la opción en el sidebar y, si escribe la URL, ve acceso denegado.
- [ ] Un usuario con rol Administrador (con el permiso correspondiente) accede y ve la vista completa.
- [ ] Llamar directamente a los endpoints de seguridad con un token de un usuario sin permiso devuelve `403` (verifícalo con una prueba, no solo en la UI).
- [ ] Un token expirado o cerrado devuelve `401` y el frontend cierra la sesión y redirige a login.
- [ ] Al seleccionar un rol, la matriz marca solo sus permisos actuales.
- [ ] Marcar/desmarcar y "Guardar cambios" persiste el cambio; recargar la página o cerrar e iniciar sesión conserva los permisos.
- [ ] "Restablecer" descarta los cambios no guardados.
- [ ] No se pueden crear asociaciones rol–permiso duplicadas.
- [ ] Retirar un permiso del rol no elimina el permiso del catálogo ni afecta a otros roles.
- [ ] El cambio de permisos de un rol se refleja en los usuarios que lo tienen (permisos efectivos = unión de sus roles).
- [ ] No es posible dejar al sistema sin ningún administrador con acceso a esta gestión.
- [ ] El estilo es coherente con el resto del frontend existente.

## Entregables

1. Resumen del reconocimiento inicial (stack, patrones detectados) y el plan de archivos.
2. Código backend (guards, interceptores, decorador de permisos, endpoints, DTOs, servicio con transacción).
3. Código frontend (ruta protegida, contexto/hook de permisos, interceptor HTTP, vista y componentes, servicio de API).
4. Pruebas: al menos tests de los guards (permitido/denegado/expirado), del servicio de sincronización de permisos, y del `ProtectedRoute`.
5. Lista breve de supuestos que tomaste y de cualquier cambio de esquema/migración necesario (idealmente ninguno).

Trabaja por etapas (backend → protección en frontend → vista) y al finalizar cada una indica qué probaste y cómo.
