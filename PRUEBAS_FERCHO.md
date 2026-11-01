# Auditoría Técnica y Guía de Pruebas — Fercho (Persona C · RBAC, Autorización Dinámica y OAuth)

> **Proyecto:** FAC Gestión Deportiva (`Spring Boot 4.1.1` + `Next.js / PrimeReact`)  
> **Alcance auditado:** `HU-SE-03`, `HU-SE-04`, `HU-SE-05`, `HU-SE-06`, Autorización Dinámica en Capa 7 OSI (`DynamicAuthorizationManager`, `PermissionMatcher`, `EffectivePermissionService`), Rol por defecto OAuth (`Discord`), Visibilidad en Frontend por permisos, Externalización de secretos y Pruebas Automatizadas (`120/120` tests en verde).

---

## 1. Cambios mínimos realizados durante esta auditoría

Para garantizar el cumplimiento del **100 %** de los criterios sin efectos colaterales, se aplicaron únicamente estos **5 ajustes puntuales**:

1. **`backend/src/main/java/com/fac/backend/service/RoleService.java` (línea 86):** Se corrigió la codificación UTF-8 del mensaje de excepción al intentar borrar un rol asignado (`"No se puede eliminar un rol que está asignado"` en lugar de `"estÃ¡"`).
2. **`backend/src/main/java/com/fac/backend/dto/PermissionRequestDTO.java` (líneas 16-17):** Se corrigió la codificación UTF-8 en las validaciones Bean Validation (`"El método es obligatorio"`, `"El método no puede superar 10 caracteres"`).
3. **`backend/src/main/java/com/fac/backend/authorization/PermissionMatcher.java` (líneas 16 y 40) y `frontend/lib/access.ts` (línea 8) + `backend/src/main/java/com/fac/backend/service/PermissionCatalogService.java` (línea 216):** Se amplió la expresión regular de normalización de segmentos dinámicos `(?i)(?<=/)(?:\\d+|[a-f0-9]{24}|\\?)(?=/|$)` y se añadió guarda contra `null` en `matches(...)`, de modo que tanto la notación `/api/roles/{id}` como la notación de clase `/api/roles/?` hacen *match* exacto contra `/api/roles/15` y rechazan `/api/roles/abc`.
4. **`backend/src/test/java/com/fac/backend/authorization/PermissionMatcherTest.java` (NUEVO):** Suite unitaria JUnit 5 que verifica explícitamente que `/api/roles/15` hace match con `/api/roles/?` y `/api/roles/{id}`, que `/api/roles/abc` es rechazado, normalización de múltiples IDs y manejo seguro de `null`.
5. **`backend/src/test/java/com/fac/backend/service/EffectivePermissionServiceTest.java` (NUEVO):** Suite unitaria JUnit 5 + Mockito que verifica la delegación a `PermissionRepository.findAllByUserId(userId)` y la presencia de `@Cacheable(cacheNames = "effectivePermissions", key = "#userId")`.

---

## 2. HU-SE-03 — Gestionar roles

### HU-SE-03 · Criterio 1: El sistema debe permitir registrar un rol indicando como mínimo su nombre y descripción.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/dto/role/RoleRequestDTO.java:12-20`, `backend/src/main/java/com/fac/backend/controller/RoleController.java:36-40` y `backend/src/main/java/com/fac/backend/service/RoleService.java:31-41`.
  - **Frontend:** `frontend/app/(main)/roles/page.tsx:189-231` y modal en `:737-869`.
  ```java
  // RoleRequestDTO.java:12-18
  @NotBlank(message = "El nombre del rol es obligatorio")
  @Size(max = 50, message = "El nombre no puede superar 50 caracteres")
  private String name;

  @NotBlank(message = "La descripción es obligatoria")
  @Size(max = 255, message = "La descripción no puede superar 255 caracteres")
  private String description;
  ```
  Valida que `name` y `description` no estén vacíos ni en cliente ni en servidor y persiste la entidad `Role` devolviendo `201 Created`.
- **Prueba paso a paso (para captura de pantalla):** Inicia sesión como `admin@uc.edu.co`, ve al menú lateral **Seguridad > Roles** (`/roles`) y pulsa el botón **+ Nuevo rol**. En el modal **Registrar rol**, escribe en **Nombre del rol**: `AUDITOR DEPORTIVO`, deja **Estado** en `● Activo`, en **Descripción**: `Supervisa actas y estadísticas de torneos` y pulsa **Guardar**. Verás el toast verde con título **`Rol creado`** y mensaje exacto: **`Se registró el rol «AUDITOR DEPORTIVO».`** (si dejas un campo vacío y pulsas **Guardar**, verás debajo del input el texto rojo exacto: **`Este campo es obligatorio`**).
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i -X POST http://localhost:8181/api/roles \
    -H "Authorization: Bearer <TOKEN_ADMIN>" \
    -H "Content-Type: application/json" \
    -d '{"name":"AUDITOR DEPORTIVO","description":"Supervisa actas y estadísticas de torneos","active":true}'
  # HTTP/1.1 201 Created -> {"id":7,"name":"AUDITOR DEPORTIVO","description":"Supervisa actas y estadísticas de torneos","active":true}
  ```
- **Qué debe mostrar la captura:** La tabla **Lista de roles** con la nueva fila `AUDITOR DEPORTIVO`, el panel derecho **Detalle del rol** mostrándolo y el toast verde `Rol creado: Se registró el rol «AUDITOR DEPORTIVO».` en la esquina superior derecha.

---

### HU-SE-03 · Criterio 2: No se deben permitir roles duplicados con el mismo nombre.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/entity/Role.java:38-44` (`unique = true`), `backend/src/main/java/com/fac/backend/repository/RoleRepository.java:10-12` (`existsByNameIgnoreCase`, `existsByNameIgnoreCaseAndIdNot`) y `backend/src/main/java/com/fac/backend/service/RoleService.java:32-37, 65-70`.
  ```java
  // RoleService.java:32-37
  if (roleRepository.existsByNameIgnoreCase(dto.getName())) {
      throw new ApplicationException(
              ErrorCase.ALREADY_EXISTS,
              "Ya existe un rol con ese nombre"
      );
  }
  ```
  Verifica sin sensibilidad a mayúsculas/minúsculas (`IgnoreCase`) tanto al crear como al actualizar (`AndIdNot`), devolviendo `409 Conflict` y además tiene restricción `UNIQUE` en base de datos.
- **Prueba paso a paso (para captura de pantalla):** Ve a **Seguridad > Roles** (`/roles`) > **+ Nuevo rol**, escribe en **Nombre del rol**: `auditor deportivo` (o `ADMIN`), en **Descripción**: `Intento duplicado` y pulsa **Guardar**. Dentro del modal aparece el banner rojo con el mensaje exacto: **`Ya existe un rol con ese nombre`**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i -X POST http://localhost:8181/api/roles \
    -H "Authorization: Bearer <TOKEN_ADMIN>" \
    -H "Content-Type: application/json" \
    -d '{"name":"admin","description":"Duplicado"}'
  # HTTP/1.1 409 Conflict -> {"status":409,"errorCase":"ALREADY_EXISTS","message":"Ya existe un rol con ese nombre",...}
  ```
- **Qué debe mostrar la captura:** El diálogo **Registrar rol** abierto con el banner rojo de error mostrando `Ya existe un rol con ese nombre`.

---

### HU-SE-03 · Criterio 3: El sistema debe permitir consultar los roles registrados.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/controller/RoleController.java:42-45` (`GET /api/roles`) y `backend/src/main/java/com/fac/backend/service/RoleService.java:43-45`.
  - **Frontend:** `frontend/app/(main)/roles/page.tsx:128-167` y tabla `DataTable` en `:471-508`.
  ```tsx
  // frontend/app/(main)/roles/page.tsx:132-133
  const data = await fetchRoles();
  setRoles(data);
  ```
  Carga todos los roles registrados y permite filtrarlos en tiempo real por texto (nombre o descripción) y por estado (`Todos los estados`, `Activo`, `Inactivo`).
- **Prueba paso a paso (para captura de pantalla):** Ve a **Seguridad > Roles** (`/roles`). Observa la tarjeta izquierda **Lista de roles** con el contador azul **`7 roles`** (o el total actual) y escribe `COORD` en el buscador `Buscar rol...` para ver cómo filtra la tabla.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/roles -H "Authorization: Bearer <TOKEN_ADMIN>"
  # HTTP 200 OK -> Array JSON con todos los roles registrados
  ```
- **Qué debe mostrar la captura:** La tabla **Lista de roles** mostrando las columnas `Rol`, `Descripción`, `Estado` (`● Activo`) y `Acciones`.

---

### HU-SE-03 · Criterio 4: Se debe poder consultar la información detallada de cada rol.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/controller/RoleController.java:47-65` (`GET /api/roles/{id}`, `GET /api/roles/{id}/detail-with-permissions`, `GET /api/roles/{id}/summary`) y `backend/src/main/java/com/fac/backend/service/RolePermissionService.java:116-140`.
  - **Frontend:** `frontend/app/(main)/roles/page.tsx:111-126` y panel derecho **Detalle del rol** en `:512-704`.
  ```tsx
  // frontend/app/(main)/roles/page.tsx:115-116
  const summary = await fetchRoleSummary(role.id);
  setSelectedSummary(summary);
  ```
  Al seleccionar una fila o pulsar el ícono del ojo (`Ver detalle del rol`), consulta `GET /api/roles/{id}/summary` y muestra ID formateado (`ID: ROL-001`), nombre, estado, descripción, conteo de `usuarios asociados`, conteo de `permisos asignados` y chips de `Módulos asociados`.
- **Prueba paso a paso (para captura de pantalla):** En **Seguridad > Roles** (`/roles`), haz clic sobre la fila **`COORDINADOR`** (o en su botón del ojo 👁️ en la columna `Acciones`). Observa el panel derecho **Detalle del rol** actualizado con los contadores y módulos de `COORDINADOR`.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/roles/2/summary -H "Authorization: Bearer <TOKEN_ADMIN>"
  # HTTP 200 OK -> {"roleId":2,"roleName":"COORDINADOR","description":"...","active":true,"usersCount":0,"assignedCount":4,"modulesWithAccess":["Gestión Deportiva"],"totalAvailable":58,"notAssignedCount":54}
  ```
- **Qué debe mostrar la captura:** El panel derecho **Detalle del rol** mostrando `ID: ROL-002`, nombre, estado, descripción, `usuarios asociados`, `permisos asignados` y los tags bajo `Módulos asociados`.

---

### HU-SE-03 · Criterio 5: Se debe permitir actualizar la información de un rol.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/controller/RoleController.java:86-92` (`PUT /api/roles/{id}`) y `backend/src/main/java/com/fac/backend/service/RoleService.java:58-74`.
  - **Frontend:** `frontend/app/(main)/roles/page.tsx:177-222`.
  ```java
  // RoleService.java:58-74
  @CacheEvict(cacheNames = CacheConfig.EFFECTIVE_PERMISSIONS_CACHE, allEntries = true)
  public RoleResponseDTO update(Long id, RoleRequestDTO dto) {
      Role role = findEntityById(id);
      if (roleRepository.existsByNameIgnoreCaseAndIdNot(dto.getName(), id)) {
          throw new ApplicationException(ErrorCase.ALREADY_EXISTS, "Ya existe un rol con ese nombre");
      }
      roleMapper.updateEntity(dto, role);
      return roleMapper.toResponseDTO(roleRepository.save(role));
  }
  ```
  Actualiza nombre, descripción y estado (`active`), validando unicidad y limpiando la caché de permisos efectivos (`@CacheEvict`).
- **Prueba paso a paso (para captura de pantalla):** En **Seguridad > Roles** (`/roles`), en la fila de `AUDITOR DEPORTIVO`, pulsa el ícono del lápiz ✏️ (**Editar rol**) o el botón **Editar** del panel derecho. En el modal **Editar rol**, cambia la **Descripción** a `Supervisa actas, arbitraje y estadísticas oficiales` y pulsa **Guardar**. Verás el toast verde con título **`Rol actualizado`** y mensaje exacto: **`Se actualizó el rol «AUDITOR DEPORTIVO».`**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i -X PUT http://localhost:8181/api/roles/7 \
    -H "Authorization: Bearer <TOKEN_ADMIN>" \
    -H "Content-Type: application/json" \
    -d '{"name":"AUDITOR DEPORTIVO","description":"Supervisa actas, arbitraje y estadísticas oficiales","active":true}'
  # HTTP/1.1 200 OK
  ```
- **Qué debe mostrar la captura:** La fila y el panel **Detalle del rol** con la nueva descripción actualizada y el toast verde `Rol actualizado: Se actualizó el rol «AUDITOR DEPORTIVO».`.

---

### HU-SE-03 · Criterio 6: Se debe permitir eliminar un rol cuando no existan restricciones que lo impidan.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/controller/RoleController.java:94-98` (`DELETE /api/roles/{id}` -> `204 No Content`) y `backend/src/main/java/com/fac/backend/service/RoleService.java:76-94`.
  - **Frontend:** `frontend/app/(main)/roles/page.tsx:233-277`.
  ```java
  // RoleService.java:89-93
  rolePermissionRepository.deleteAll(
          rolePermissionRepository.findAllByRoleId(id)
  );
  roleRepository.delete(role);
  ```
  Cuando el rol no tiene usuarios asociados, retira primero sus filas en `role_permissions` y elimina el rol de la tabla `roles`.
- **Prueba paso a paso (para captura de pantalla):** Crea un rol temporal `ROL TEMPORAL` (sin usuarios asociados). En la fila `ROL TEMPORAL`, pulsa el ícono de basurero rojo 🗑️ (**Eliminar rol**). En el diálogo de confirmación **`Eliminar rol`** (`¿Deseas eliminar el rol ROL TEMPORAL?`), pulsa el botón rojo **Eliminar**. Aparecerá el toast verde con título **`Rol eliminado`** y mensaje exacto: **`El rol «ROL TEMPORAL» fue eliminado correctamente.`**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i -X DELETE http://localhost:8181/api/roles/8 -H "Authorization: Bearer <TOKEN_ADMIN>"
  # HTTP/1.1 204 No Content
  ```
- **Qué debe mostrar la captura:** El diálogo de confirmación antes de borrar (o el toast verde `Rol eliminado: El rol «ROL TEMPORAL» fue eliminado correctamente.` tras desaparecer de la tabla).

---

### HU-SE-03 · Criterio 7: Antes de eliminar un rol, el sistema debe validar si se encuentra asignado a usuarios.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/service/RoleService.java:83-88` y `backend/src/main/java/com/fac/backend/repository/UserRoleRepository.java:32`.
  - **Frontend:** `frontend/app/(main)/roles/page.tsx:263-274` y tarjeta de alerta roja en `:706-733`.
  ```java
  // RoleService.java:83-88
  if (userRoleRepository.existsByRoleId(id)) {
      throw new ApplicationException(
              ErrorCase.INVALID_OPERATION,
              "No se puede eliminar un rol que está asignado"
      );
  }
  ```
  Si `existsByRoleId(id)` es `true`, aborta la eliminación con `400 Bad Request` (`INVALID_OPERATION`).
- **Prueba paso a paso (para captura de pantalla):** En **Seguridad > Roles** (`/roles`), ubica el rol **`ADMIN`** (que tiene al usuario `Administrador` asociado) y pulsa el ícono de basurero 🗑️ (**Eliminar rol**) > **Eliminar**. Verás dos evidencias simultáneas:
  1. Toast rojo con título **`No se puede eliminar el rol`** y detalle exacto del backend: **`No se puede eliminar un rol que está asignado`**.
  2. Tarjeta con borde rojo debajo del detalle con título **`No se puede eliminar el rol`** y texto exacto: **`No se puede eliminar 'ADMIN' porque tiene usuarios asociados o restricciones activas.`**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i -X DELETE http://localhost:8181/api/roles/1 -H "Authorization: Bearer <TOKEN_ADMIN>"
  # HTTP/1.1 400 Bad Request -> {"status":400,"errorCase":"INVALID_OPERATION","message":"No se puede eliminar un rol que está asignado",...}
  ```
- **Qué debe mostrar la captura:** La alerta de borde rojo debajo del panel derecho y el toast de error indicando `No se puede eliminar un rol que está asignado`, permaneciendo `ADMIN` en la tabla.

---

### HU-SE-03 · Criterio 8: Desde la consulta de un rol se debe poder acceder a la gestión de sus usuarios y permisos.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Frontend:** `frontend/app/(main)/roles/page.tsx:339-360` (iconos en la tabla) y `:657-683` (botones en el panel **Detalle del rol**).
  ```tsx
  // frontend/app/(main)/roles/page.tsx:658-682
  <Button label="Usuarios del rol" icon="pi pi-users"
      onClick={() => router.push(`/roles/${selectedRole.id}/usuarios`)} />
  {canManagePermissions && (
      <Button label="Permisos" icon="pi pi-key"
          onClick={() => router.push(`/roles/permisos?roleId=${selectedRole.id}`)} />
  )}
  ```
  Tanto desde las acciones de cada fila como desde el panel derecho **Detalle del rol**, los botones redirigen directamente a `/roles/{id}/usuarios` (HU-SE-04) y `/roles/permisos?roleId={id}` (HU-SE-06) con el rol ya preseleccionado.
- **Prueba paso a paso (para captura de pantalla):** En **Seguridad > Roles** (`/roles`), selecciona `COORDINADOR`. En el panel derecho **Detalle del rol**, verifica los botones **`Usuarios del rol`** y **`Permisos`**. Haz clic en **`Usuarios del rol`** (te lleva a `/roles/2/usuarios` con `COORDINADOR` seleccionado) y luego en **`Permisos`** (te lleva a `/roles/permisos?roleId=2` con `COORDINADOR` cargado en la matriz).
- **Prueba alterna (si no se ve en la UI):** Navegación directa por URL `/roles/2/usuarios` y `/roles/permisos?roleId=2`.
- **Qué debe mostrar la captura:** El panel derecho **Detalle del rol** mostrando claramente los botones `Usuarios del rol`, `Permisos` y `Editar`, junto con los íconos `👥` y `🔑` en la fila de la tabla.

---

### HU-SE-03 · Criterio 9: Eliminar un rol no debe eliminar los usuarios ni los permisos existentes en la plataforma.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend (Entidades y Servicio):** `backend/src/main/java/com/fac/backend/entity/Role.java:61-67` y `backend/src/main/java/com/fac/backend/service/RoleService.java:80-94`.
  - **Test de Integración:** `backend/src/test/java/com/fac/backend/service/RoleServiceDeleteIntegrationTest.java:36-56`.
  ```java
  // Role.java:61-67 — SIN CascadeType.REMOVE ni orphanRemoval hacia User ni Permission
  @OneToMany(mappedBy = "role", fetch = FetchType.LAZY)
  private List<UserRole> userRoles = new ArrayList<>();

  @OneToMany(mappedBy = "role", fetch = FetchType.LAZY)
  private List<RolePermission> rolePermissions = new ArrayList<>();
  ```
  `Role` no define `CascadeType.ALL` ni `CascadeType.REMOVE` sobre usuarios ni permisos. En `RoleService.delete(id)` solo se borran las filas intermedias de `role_permissions` y el registro en `roles`.
- **Prueba paso a paso (para captura de pantalla):**
  1. Ve a **Seguridad > Permisos** (`/permisos`) y observa el contador superior: **`58 permisos`** (o el total actual).
  2. Crea un rol `ROL PRUEBA BORRADO`, ve a **Asignar permisos** (`/roles/permisos`), asígnale los permisos de `Torneos`, guarda cambios y vuelve a **Roles** (`/roles`).
  3. Elimina `ROL PRUEBA BORRADO` pulsando 🗑️ > **Eliminar**.
  4. Ve a **Seguridad > Permisos** (`/permisos`) y **Seguridad > Usuarios** (`/usuarios`): verifica que siguen exactamente los mismos **58 permisos** y todos los usuarios intactos.
- **Prueba alterna (si no se ve en la UI):**
  ```sql
  -- En MySQL antes y después de DELETE /api/roles/{id}:
  SELECT (SELECT COUNT(*) FROM users) AS total_users,
         (SELECT COUNT(*) FROM permissions) AS total_permissions,
         (SELECT COUNT(*) FROM roles) AS total_roles;
  -- total_roles disminuye en 1; total_users y total_permissions permanecen idénticos.
  ```
- **Qué debe mostrar la captura:** Comparativa (o consulta SQL / vista de Permisos) donde `total_permissions` (58) y `total_users` permanecen intactos tras eliminar el rol que tenía permisos asignados.

---

## 3. HU-SE-04 — Asignar roles a usuarios

> **Nota de auditoría sobre la regla "¿Un usuario no puede quedar con 0 roles?":**  
> Revisamos el `Anexo_1_Módulo Seguridad (1).md` (líneas 76-116) y el código actual (`backend/src/main/java/com/fac/backend/service/UserRoleService.java:77-83`). **El Anexo 1 NO prohíbe que un usuario quede con 0 roles**; al contrario, el criterio de aceptación de HU-SE-06 y las reglas del anexo establecen explícitamente: *"Si ninguno de los roles del usuario posee el permiso requerido, la operación debe ser denegada"* y *"Cuando se retire un usuario de un rol, el sistema debe actualizar sus accesos de acuerdo con los roles que conserve"*.  
> En `UserRoleService.delete(Long userId, Long roleId)` (líneas 81-83) **sí se permite retirar el último rol de un usuario**, lo cual **concuerda 100 % con el Anexo 1** y además permite probar limpiamente el escenario de un usuario sin permisos (0 roles o rol sin permisos).

### HU-SE-04 · Criterio 1: El usuario y el rol deben existir previamente en el sistema.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/service/UserRoleService.java:38-42`.
  ```java
  // UserRoleService.java:39-42
  User user = userRepository.findById(dto.getUserId())
          .orElseThrow(() -> new ApplicationException(ErrorCase.NOT_FOUND, "Usuario no encontrado"));
  Role role = roleRepository.findById(dto.getRoleId())
          .orElseThrow(() -> new ApplicationException(ErrorCase.NOT_FOUND, "Rol no encontrado"));
  ```
  Si `userId` o `roleId` no existen en base de datos, lanza `ApplicationException(ErrorCase.NOT_FOUND)` devolviendo `404 Not Found`.
- **Prueba paso a paso (para captura de pantalla):** En el navegador, entra a una ruta de rol inexistente o inválida como `/roles/abc/usuarios` (muestra el estado vacío **`Rol no válido`: `El identificador del rol no es válido.`**) o consulta un `roleId` inexistente `9999`.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i -X POST http://localhost:8181/api/user-roles \
    -H "Authorization: Bearer <TOKEN_ADMIN>" \
    -H "Content-Type: application/json" \
    -d '{"userId":9999,"roleId":1}'
  # HTTP/1.1 404 Not Found -> {"status":404,"errorCase":"NOT_FOUND","message":"Usuario no encontrado",...}

  curl -i -X POST http://localhost:8181/api/user-roles \
    -H "Authorization: Bearer <TOKEN_ADMIN>" \
    -H "Content-Type: application/json" \
    -d '{"userId":1,"roleId":9999}'
  # HTTP/1.1 404 Not Found -> {"status":404,"errorCase":"NOT_FOUND","message":"Rol no encontrado",...}
  ```
- **Qué debe mostrar la captura:** Respuesta `404 Not Found` en Postman/cURL con los mensajes exactos `Usuario no encontrado` y `Rol no encontrado`.

---

### HU-SE-04 · Criterio 2: El sistema debe permitir seleccionar un rol y visualizar los usuarios asociados a ese rol.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/controller/UserRoleController.java:36-40` (`GET /api/user-roles/roles/{roleId}`) y `backend/src/main/java/com/fac/backend/service/UserRoleService.java:64-67`.
  - **Frontend:** `frontend/app/(main)/roles/[id]/usuarios/page.tsx:151-156`, selector `Dropdown` en `:318-361` y panel derecho **Usuarios asociados** en `:531-626`.
  ```tsx
  // frontend/app/(main)/roles/[id]/usuarios/page.tsx:151-156
  const handleRoleSelect = (nextRoleId: number) => {
      if (nextRoleId === selectedRoleId) return;
      setSelectedRoleId(nextRoleId);
      setStatusBanner(null);
      void loadRoleAssociations(nextRoleId);
  };
  ```
- **Prueba paso a paso (para captura de pantalla):** Ve a **Seguridad > Roles** (`/roles`), pulsa el ícono 👥 (**Usuarios del rol**) en `ADMIN` (`/roles/1/usuarios`). Arriba en el selector **Seleccionar rol**, cámbialo de `ADMIN` a `COORDINADOR` y luego de vuelta a `ADMIN`. En el cuadro derecho **Usuarios asociados** verás el contador en verde (`1 usuarios asociados`) y la tarjeta de `Administrador (admin@uc.edu.co)`.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/user-roles/roles/1 -H "Authorization: Bearer <TOKEN_ADMIN>"
  # HTTP 200 OK -> [{"id":1,"user":{"id":1,"name":"Administrador","email":"admin@uc.edu.co","enabled":true}}]
  ```
- **Qué debe mostrar la captura:** La vista **Asociar usuarios con roles** (`/roles/1/usuarios`) con el dropdown superior en `ADMIN` y el panel derecho **Usuarios asociados** listando sus usuarios.

---

### HU-SE-04 · Criterio 3: Desde la vista de un rol se debe permitir agregar usuarios al rol seleccionado.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/controller/UserRoleController.java:24-28` (`POST /api/user-roles` -> `201 Created`) y `backend/src/main/java/com/fac/backend/service/UserRoleService.java:38-52`.
  - **Frontend:** `frontend/app/(main)/roles/[id]/usuarios/page.tsx:170-199` y botón **`+ Asociar`** en `:471-492`.
  ```tsx
  // frontend/app/(main)/roles/[id]/usuarios/page.tsx:177-185
  await assignUserToRole(targetUser.id, selectedRoleId);
  await loadRoleAssociations(selectedRoleId);
  setStatusBanner(`${targetUser.name} asociado correctamente.`);
  toast.current?.show({
      severity: 'success',
      summary: 'Usuario asociado',
      detail: `${targetUser.name} ahora tiene el rol «${selectedRole?.name ?? ''}».`,
      life: 3000
  });
  ```
- **Prueba paso a paso (para captura de pantalla):** En `/roles/2/usuarios` (con el rol `COORDINADOR` seleccionado), en el cuadro izquierdo **Usuarios disponibles**, ubica la tarjeta del usuario de prueba (ej. `Carlos Pérez`) y pulsa el botón **`+ Asociar`**. Verás aparecer:
  1. El banner superior con borde verde y el texto exacto: **`Carlos Pérez asociado correctamente.`**.
  2. El toast verde con título **`Usuario asociado`** y detalle exacto: **`Carlos Pérez ahora tiene el rol «COORDINADOR».`**.
  3. El usuario pasa de inmediato al cuadro derecho **Usuarios asociados**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i -X POST http://localhost:8181/api/user-roles \
    -H "Authorization: Bearer <TOKEN_ADMIN>" \
    -H "Content-Type: application/json" \
    -d '{"userId":2,"roleId":2}'
  # HTTP/1.1 201 Created
  ```
- **Qué debe mostrar la captura:** El banner verde `Carlos Pérez asociado correctamente.`, el toast `Usuario asociado` y el usuario visible en el panel derecho **Usuarios asociados**.

---

### HU-SE-04 · Criterio 4: El sistema debe mostrar los usuarios disponibles para ser asociados al rol.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/repository/UserRepository.java:39-51` (`findAvailableByRoleId` con `NOT EXISTS`), `backend/src/main/java/com/fac/backend/service/UserRoleService.java:70-75` y `backend/src/main/java/com/fac/backend/controller/UserRoleController.java:42-46` (`GET /api/user-roles/roles/{roleId}/available-users`).
  - **Frontend:** `frontend/app/(main)/roles/[id]/usuarios/page.tsx:388-528` (panel izquierdo **Usuarios disponibles** con contador `X disponibles`, buscador y tarjetas con botón `+ Asociar` siguiendo la estructura de `HU-GD-03.png`).
  ```java
  // UserRepository.java:39-50
  @Query("""
          SELECT u FROM User u
          WHERE NOT EXISTS (
              SELECT 1 FROM UserRole ur
              WHERE ur.user.id = u.id AND ur.role.id = :roleId
          )
          ORDER BY u.name ASC
          """)
  List<User> findAvailableByRoleId(@Param("roleId") Long roleId);
  ```
- **Prueba paso a paso (para captura de pantalla):** En `/roles/2/usuarios`, observa el panel izquierdo **Usuarios disponibles** con el badge azul **`X disponibles`** en la esquina superior derecha del cuadro, el buscador `Buscar usuarios...` y las tarjetas de usuarios con su avatar, nombre, correo y botón `+ Asociar`.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/user-roles/roles/2/available-users \
    -H "Authorization: Bearer <TOKEN_ADMIN>"
  # HTTP 200 OK -> Lista JSON de usuarios que aún no tienen el rol 2
  ```
- **Qué debe mostrar la captura:** El cuadro izquierdo **Usuarios disponibles** mostrando el tag `X disponibles`, el buscador y las tarjetas de usuarios disponibles.

---

### HU-SE-04 · Criterio 5: Un usuario puede tener varios roles asignados.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** Entidad intermedia `backend/src/main/java/com/fac/backend/entity/UserRole.java:8-32` (`N:M` descompuesta en dos `@ManyToOne` con `@Id Long id` propio) y `UserRoleService.findByUserId(userId)` (`GET /api/user-roles/users/{userId}`).
  - **Frontend:** Tanto desde `/roles/[id]/usuarios` (cambiando de rol en el selector y asociando al mismo usuario) como desde `/usuarios/[id]/roles` (`frontend/app/(main)/usuarios/[id]/roles/page.tsx`).
- **Prueba paso a paso (para captura de pantalla):** En `/roles/2/usuarios`, asocia a `Carlos Pérez` al rol `COORDINADOR`. Luego cambia el selector superior **Seleccionar rol** a `CONSULTOR` y pulsa **`+ Asociar`** en la tarjeta de `Carlos Pérez`. Después ve a **Seguridad > Usuarios** (`/usuarios`) y pulsa el ícono de escudo (`Gestionar roles`) en la fila de `Carlos Pérez` (`/usuarios/2/roles`): verás que tiene asignados simultáneamente `COORDINADOR` y `CONSULTOR`.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/user-roles/users/2 -H "Authorization: Bearer <TOKEN_ADMIN>"
  # HTTP 200 OK -> Devuelve las 2 asociaciones (COORDINADOR y CONSULTOR) para el userId 2
  ```
- **Qué debe mostrar la captura:** La vista `/usuarios/2/roles` (o respuesta de `/api/user-roles/users/2`) mostrando a `Carlos Pérez` con **2 roles asignados** (`COORDINADOR` y `CONSULTOR`).

---

### HU-SE-04 · Criterio 6: Un rol puede estar asignado a varios usuarios.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/repository/UserRoleRepository.java:22-23` (`findAllByRoleId`) y `backend/src/main/java/com/fac/backend/service/UserRoleService.java:64-67`.
  - **Frontend:** `frontend/app/(main)/roles/[id]/usuarios/page.tsx:542-611`.
- **Prueba paso a paso (para captura de pantalla):** En `/roles/2/usuarios` (`COORDINADOR`), pulsa **`+ Asociar`** en `Carlos Pérez` y luego pulsa **`+ Asociar`** en `Laura Gómez` (o `Administrador`). Observa en el cuadro derecho **Usuarios asociados** que el contador verde sube a **`2 usuarios asociados`** y aparecen ambos usuarios listados.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/user-roles/roles/2 -H "Authorization: Bearer <TOKEN_ADMIN>"
  # HTTP 200 OK -> Array con los múltiples usuarios asociados al rol 2
  ```
- **Qué debe mostrar la captura:** El panel derecho **Usuarios asociados** mostrando `2 usuarios asociados` (o más) con las filas de ambos usuarios dentro del mismo rol.

---

### HU-SE-04 · Criterio 7: No se debe asignar dos veces el mismo rol al mismo usuario.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/entity/UserRole.java:11-14` (`@UniqueConstraint(name = "uk_user_role", columnNames = {"user_id", "role_id"})`) y `backend/src/main/java/com/fac/backend/service/UserRoleService.java:44-46`.
  - **Frontend:** `frontend/app/(main)/roles/[id]/usuarios/page.tsx:480-507`.
  ```java
  // UserRoleService.java:44-46
  if (userRoleRepository.existsByUserIdAndRoleId(dto.getUserId(), dto.getRoleId())) {
      throw new ApplicationException(ErrorCase.ALREADY_EXISTS, "El usuario ya tiene asignado ese rol");
  }
  ```
  En la UI (`page.tsx:481-507`), cuando el usuario ya pertenece al rol, el botón `+ Asociar` queda deshabilitado (`disabled`) y debajo de la tarjeta aparece un recuadro amarillo con el texto exacto: **`Este usuario ya se encuentra asociado al rol.`** (igual que en el mockup `HU-GD-03.png`). Y si se invoca por API directamente, el backend responde `409 Conflict` con **`El usuario ya tiene asignado ese rol`**.
- **Prueba paso a paso (para captura de pantalla):** En `/roles/1/usuarios` (`ADMIN`), observa la tarjeta de `Administrador` en el cuadro izquierdo **Usuarios disponibles**: el botón `Asociar` está deshabilitado y muestra la alerta amarilla con el mensaje exacto: **`Este usuario ya se encuentra asociado al rol.`**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i -X POST http://localhost:8181/api/user-roles \
    -H "Authorization: Bearer <TOKEN_ADMIN>" \
    -H "Content-Type: application/json" \
    -d '{"userId":1,"roleId":1}'
  # HTTP/1.1 409 Conflict -> {"status":409,"errorCase":"ALREADY_EXISTS","message":"El usuario ya tiene asignado ese rol",...}
  ```
- **Qué debe mostrar la captura:** La tarjeta del usuario ya asociado en el cuadro izquierdo con el botón `Asociar` deshabilitado y el aviso amarillo `Este usuario ya se encuentra asociado al rol.`.

---

### HU-SE-04 · Criterio 8: Se debe permitir retirar la asociación de un usuario con un rol.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/controller/UserRoleController.java:48-52` (`DELETE /api/user-roles/{userId}/{roleId}` -> `204 No Content`) y `backend/src/main/java/com/fac/backend/service/UserRoleService.java:77-83`.
  - **Frontend:** `frontend/app/(main)/roles/[id]/usuarios/page.tsx:222-249` y botón **`Retirar asociación`** en `:589-606`.
  ```java
  // UserRoleService.java:77-83
  @CacheEvict(cacheNames = CacheConfig.EFFECTIVE_PERMISSIONS_CACHE, allEntries = true)
  public void delete(Long userId, Long roleId) {
      userRoleRepository.delete(findAssignment(userId, roleId));
  }
  ```
- **Prueba paso a paso (para captura de pantalla):** En `/roles/2/usuarios` (`COORDINADOR`), en el cuadro derecho **Usuarios asociados**, pulsa el botón **`Retirar asociación`** junto a `Laura Gómez` y confirma en el diálogo pulsando **`Retirar asociación`**. Aparecerá:
  1. El banner superior verde con el texto exacto: **`Se retiró la asociación de Laura Gómez.`**.
  2. El toast verde con título **`Asociación retirada`** y detalle exacto: **`Laura Gómez ya no pertenece al rol «COORDINADOR».`**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i -X DELETE http://localhost:8181/api/user-roles/3/2 -H "Authorization: Bearer <TOKEN_ADMIN>"
  # HTTP/1.1 204 No Content
  ```
- **Qué debe mostrar la captura:** El banner verde `Se retiró la asociación de ...` y el toast verde `Asociación retirada`, con el contador de `Usuarios asociados` disminuido en 1.

---

### HU-SE-04 · Criterio 9: Retirar un rol a un usuario no debe eliminar ni el usuario ni el rol del sistema.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/entity/UserRole.java:25-31` y `backend/src/main/java/com/fac/backend/service/UserRoleService.java:81-83`.
  ```java
  // UserRole.java:25-31 — @ManyToOne sin CascadeType.REMOVE hacia User ni hacia Role
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "role_id", nullable = false)
  private Role role;
  ```
  `userRoleRepository.delete(...)` solo borra la fila de la tabla intermedia `user_roles`; las tablas `users` y `roles` no se tocan.
- **Prueba paso a paso (para captura de pantalla):** En `/roles/2/usuarios`, tras retirar la asociación de `Laura Gómez` del rol `COORDINADOR`, observa que en la misma pantalla:
  1. El rol `COORDINADOR` sigue activo en el selector superior.
  2. `Laura Gómez` sigue existiendo inmediatamente en el cuadro izquierdo **Usuarios disponibles** con el botón `+ Asociar` habilitado.
- **Prueba alterna (si no se ve en la UI):**
  ```sql
  SELECT (SELECT COUNT(*) FROM users WHERE id = 3) AS user_exists,
         (SELECT COUNT(*) FROM roles WHERE id = 2) AS role_exists,
         (SELECT COUNT(*) FROM user_roles WHERE user_id = 3 AND role_id = 2) AS link_exists;
  -- user_exists = 1, role_exists = 1, link_exists = 0
  ```
- **Qué debe mostrar la captura:** La vista `/roles/2/usuarios` justo después de retirar la asociación, donde el usuario aparece intacto en el panel izquierdo **Usuarios disponibles** y el rol sigue en el selector.

---

### HU-SE-04 · Criterio 10: Los cambios en la asociación de roles deben reflejarse en los permisos efectivos del usuario.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/service/UserRoleService.java:34-37` y `:77-80` tienen `@CacheEvict(cacheNames = CacheConfig.EFFECTIVE_PERMISSIONS_CACHE, allEntries = true)`. Al consultar `GET /api/auth/me` o cualquier endpoint protegido, `EffectivePermissionService.findByUserId(userId)` recalcula el Triple JOIN en `PermissionRepository.findAllByUserId(userId)`.
  - **Frontend:** `frontend/app/(main)/roles/[id]/usuarios/page.tsx:186-188, 236-238` invoca `refreshPermissions()` y en `/usuarios/[id]/roles` el panel **Permisos efectivos** (`EffectivePermissionsPanel.tsx`) muestra en vivo la unión de permisos de los roles del usuario.
- **Prueba paso a paso (para captura de pantalla):**
  1. Ve a `/usuarios/2/roles` (`Carlos Pérez`): cuando solo tiene el rol `AFICIONADO`, el panel derecho **Permisos efectivos** muestra **`0 permisos`** (`Este usuario no tiene permisos efectivos activos`).
  2. Asígnale el rol `CONSULTOR` (que tiene `GET /api/users` y `GET /api/users/{id}`). De inmediato el panel **Permisos efectivos** se actualiza mostrando **`2 permisos`** bajo el módulo `Administración` (`Listar Usuarios`, `Ver Usuarios`).
  3. Si inicias sesión con `Carlos Pérez` en otra ventana y recargas, el menú lateral **Seguridad > Usuarios** aparece al instante; si le retiras `CONSULTOR`, al recargar desaparece y `/api/users` responde `403 Forbidden`.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  # Con el token de Carlos Pérez (userId=2) antes y después de POST /api/user-roles {"userId":2,"roleId":4}:
  curl -s http://localhost:8181/api/auth/me -H "Authorization: Bearer <TOKEN_CARLOS>"
  # El arreglo "permissions" pasa de [] a incluir GET /api/users y GET /api/users/{id} sin necesidad de relogin.
  ```
- **Qué debe mostrar la captura:** El panel **Permisos efectivos** en `/usuarios/2/roles` antes y después de asociar/retirar el rol, reflejando el cambio inmediato en el conteo y listado de permisos.

---

### HU-SE-04 · Criterio 11: Antes de retirar la asociación de un usuario con un rol, el sistema debe solicitar confirmación.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Frontend:** `frontend/app/(main)/roles/[id]/usuarios/page.tsx:201-251` (`confirmRemoveUser` usando `confirmDialog` de PrimeReact) y también en `/usuarios/[id]/roles/page.tsx`.
  ```tsx
  // frontend/app/(main)/roles/[id]/usuarios/page.tsx:202-221
  confirmDialog({
      header: 'Retirar asociación de rol',
      icon: 'pi pi-exclamation-triangle',
      message: (
          <div className="flex flex-column gap-2 line-height-3">
              <span>
                  ¿Deseas retirar a <strong>{targetUser.name}</strong> del rol{' '}
                  <strong>{selectedRole?.name ?? 'seleccionado'}</strong>?
              </span>
              <span className="text-600 text-sm">
                  Retirar el rol no elimina al usuario ni al rol del sistema;
                  únicamente se retira la asociación y sus permisos efectivos se actualizarán.
              </span>
          </div>
      ),
      acceptLabel: 'Retirar asociación',
      rejectLabel: 'Cancelar', ...
  ```
- **Prueba paso a paso (para captura de pantalla):** En `/roles/2/usuarios`, en el panel derecho **Usuarios asociados**, haz clic en **`Retirar asociación`** sobre cualquier usuario y **no pulses aún confirmar**. Toma la captura con el modal de confirmación abierto en pantalla.
- **Prueba alterna (si no se ve en la UI):** Criterio específico de interfaz gráfica (verificable directamente en el modal `ConfirmDialog` de `/roles/[id]/usuarios`).
- **Qué debe mostrar la captura:** El diálogo modal **`Retirar asociación de rol`** con el texto `¿Deseas retirar a <Nombre> del rol <Rol>? Retirar el rol no elimina al usuario ni al rol del sistema...` y los botones `Cancelar` y `Retirar asociación`.

---

## 4. HU-SE-05 — Gestionar permisos

### HU-SE-05 · Criterio 1: El sistema debe permitir registrar un permiso dentro de la plataforma.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/controller/PermissionController.java:29-33` (`POST /api/permissions` -> `201 Created`) y `backend/src/main/java/com/fac/backend/service/PermissionService.java:34-47`.
  - **Frontend:** `frontend/app/(main)/permisos/page.tsx:295-339` y diálogo modal en `:814-1019`.
- **Prueba paso a paso (para captura de pantalla):** Ve a **Seguridad > Permisos** (`/permisos`) y pulsa el botón **`+ Nuevo permiso`**. En el modal **Registrar permiso**, selecciona **Método HTTP**: `POST (Crear)`, **URL del endpoint**: `/api/inscripciones`, **Módulo**: `Gestión Deportiva`, **Recurso**: `Inscripciones` y pulsa **Guardar**. Verás el toast verde con título **`Permiso registrado`** y detalle exacto: **`POST /api/inscripciones`**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i -X POST http://localhost:8181/api/permissions \
    -H "Authorization: Bearer <TOKEN_ADMIN>" \
    -H "Content-Type: application/json" \
    -d '{"method":"POST","url":"/api/inscripciones","module":"Gestión Deportiva","resource":"Inscripciones"}'
  # HTTP/1.1 201 Created
  ```
- **Qué debe mostrar la captura:** El toast verde `Permiso registrado: POST /api/inscripciones` y la nueva fila `Inscripciones / Gestión Deportiva` en la tabla **Catálogo de permisos**.

---

### HU-SE-05 · Criterio 2: Cada permiso debe identificar el recurso o módulo sobre el cual aplica.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/entity/Permission.java:61-65` (columnas `module` y `resource`), `backend/src/main/java/com/fac/backend/service/PermissionService.java:120-128` y `backend/src/main/java/com/fac/backend/service/PermissionCatalogService.java:131-175`.
  - **Frontend:** Columna `Recurso / Módulo` en `frontend/app/(main)/permisos/page.tsx:391-399, 597-600` y filtro por módulo en `:523-531`.
  ```java
  // PermissionService.java:124-127
  PermissionCatalogService.ResourceDescriptor derived =
          permissionCatalogService.resolveResource(dto.getUrl());
  dto.setModule(valueOrDefault(dto.getModule(), derived.module()));
  dto.setResource(valueOrDefault(dto.getResource(), derived.resource()));
  ```
  Cada permiso almacena su `module` y `resource` (y si se envían vacíos al crearlo, los deduce automáticamente de la URL).
- **Prueba paso a paso (para captura de pantalla):** En **Seguridad > Permisos** (`/permisos`), observa la primera columna **`Recurso / Módulo`** de la tabla (muestra en negrita el recurso como `Torneos` y debajo el módulo `Gestión Deportiva`) y despliega el filtro superior **`Todos los módulos`** para filtrar por `Gestión Deportiva` o `Administración`.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/permissions/catalog -H "Authorization: Bearer <TOKEN_ADMIN>"
  # HTTP 200 OK -> Devuelve cada permiso con "module" y "resource" poblados
  ```
- **Qué debe mostrar la captura:** La tabla **Catálogo de permisos** con la columna `Recurso / Módulo` y el selector de filtro por módulo desplegado.

---

### HU-SE-05 · Criterio 3: Cada permiso debe indicar la operación que autoriza.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/authorization/PermissionOperation.java:3-19` (`VER`, `LISTAR`, `CREAR`, `ACTUALIZAR`, `ELIMINAR`) y `backend/src/main/java/com/fac/backend/service/PermissionCatalogService.java:111-129`.
  - **Frontend:** Columna `Operación` (`operationBody`) en `frontend/app/(main)/permisos/page.tsx:401-406, 601`, filtro por operación en `:532-542` y asistente rápido en `:874-890`.
  ```java
  // PermissionCatalogService.java:118-125
  return switch (normalizedMethod) {
      case "GET" -> hasIdentifier ? PermissionOperation.VER : PermissionOperation.LISTAR;
      case "POST" -> PermissionOperation.CREAR;
      case "PUT", "PATCH" -> PermissionOperation.ACTUALIZAR;
      case "DELETE" -> PermissionOperation.ELIMINAR; ...
  ```
- **Prueba paso a paso (para captura de pantalla):** En **Seguridad > Permisos** (`/permisos`), observa la columna **`Operación`** con los badges azules (`Listar`, `Ver`, `Crear`, `Actualizar`, `Eliminar`) y usa el filtro superior **`Todas las operaciones`** seleccionando `Crear`.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/permissions/catalog -H "Authorization: Bearer <TOKEN_ADMIN>"
  # Cada item incluye: "operation": "CREAR", "operationLabel": "Crear"
  ```
- **Qué debe mostrar la captura:** La columna `Operación` en la tabla de `/permisos` y el filtro de operaciones mostrando `Ver`, `Listar`, `Crear`, `Actualizar`, `Eliminar`.

---

### HU-SE-05 · Criterio 4: De acuerdo con el modelo, el permiso también podrá asociar información técnica como URL, método HTTP y modelo o recurso relacionado.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/entity/Permission.java:45-66` (`url`, `method`, `module`, `resource`) y `backend/src/main/java/com/fac/backend/dto/PermissionResponseDTO.java`.
  - **Frontend:** Columna `Método y URL` (`endpointBody`) en `frontend/app/(main)/permisos/page.tsx:408-419` y formulario con **Asistente rápido por Recurso y Operación** + campos `Método HTTP`, `URL del endpoint`, `Módulo` y `Recurso` en `:838-1001`.
- **Prueba paso a paso (para captura de pantalla):** En **Seguridad > Permisos** (`/permisos`), pulsa **`+ Nuevo permiso`**. En el cuadro **Asistente rápido por Recurso y Operación**, elige **Recurso / Módulo**: `Torneos (/api/torneos)` y **Operación que autoriza**: `Actualizar (PUT /{id})`. Observa cómo se autocompletan automáticamente **Método HTTP** = `PUT (Actualizar)` y **URL del endpoint** = `/api/torneos/{id}`.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/permissions -H "Authorization: Bearer <TOKEN_ADMIN>" | head -c 400
  # [{"id":1,"url":"/api/users","method":"GET","module":"Administración","resource":"Usuarios"}, ...]
  ```
- **Qué debe mostrar la captura:** El modal **Registrar permiso** mostrando el asistente rápido y los 4 campos técnicos (`Método HTTP`, `URL del endpoint`, `Módulo`, `Recurso`).

---

### HU-SE-05 · Criterio 5: El sistema debe permitir consultar el listado de permisos registrados.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/controller/PermissionController.java:35-43` (`GET /api/permissions` y `GET /api/permissions/catalog`).
  - **Frontend:** `frontend/app/(main)/permisos/page.tsx:186-211` y `DataTable` en `:567-611`.
- **Prueba paso a paso (para captura de pantalla):** Entra a **Seguridad > Permisos** (`/permisos`). Observa la tabla **Catálogo de permisos** con el badge **`58 permisos`** (o el total registrado), paginación de 10 en 10 y barra de búsqueda por texto, módulo y operación.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/permissions -H "Authorization: Bearer <TOKEN_ADMIN>"
  ```
- **Qué debe mostrar la captura:** La vista `/permisos` con la tabla **Catálogo de permisos** cargada y el contador total de permisos.

---

### HU-SE-05 · Criterio 6: Se debe poder consultar el detalle de un permiso.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/controller/PermissionController.java:45-48` (`GET /api/permissions/{id}`) y `backend/src/main/java/com/fac/backend/controller/RolePermissionController.java:44-48` (`GET /api/role-permissions/permissions/{permissionId}`).
  - **Frontend:** `frontend/app/(main)/permisos/page.tsx:173-184` (`selectPermissionDetail`) y panel derecho **Detalle del permiso** en `:616-781`.
- **Prueba paso a paso (para captura de pantalla):** En **Seguridad > Permisos** (`/permisos`), haz clic sobre la fila **`Listar Torneos` (`GET /api/torneos`)** o en su ícono del ojo 👁️. Observa a la derecha la tarjeta **Detalle del permiso** mostrando `ID: PER-XXX`, `Módulo: Gestión Deportiva`, `Recurso: Torneos`, `Operación: Listar`, `URL: /api/torneos`, el contador `Roles que incluyen este permiso` (`2`) y los tags `● ADMIN` y `● COORDINADOR` bajo **Roles asociados**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/permissions/1 -H "Authorization: Bearer <TOKEN_ADMIN>"
  curl -s http://localhost:8181/api/role-permissions/permissions/1 -H "Authorization: Bearer <TOKEN_ADMIN>"
  ```
- **Qué debe mostrar la captura:** El panel lateral derecho **Detalle del permiso** mostrando todos sus metadatos y los chips de **Roles asociados**.

---

### HU-SE-05 · Criterio 7: Se debe permitir actualizar la información de un permiso.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/controller/PermissionController.java:50-56` (`PUT /api/permissions/{id}`) y `backend/src/main/java/com/fac/backend/service/PermissionService.java:67-81`.
  - **Frontend:** `frontend/app/(main)/permisos/page.tsx:264-277, 316-331`.
- **Prueba paso a paso (para captura de pantalla):** En **Seguridad > Permisos** (`/permisos`), ubica el permiso `POST /api/inscripciones` que creaste en el Criterio 1, pulsa el ícono del lápiz ✏️ (**Editar permiso**), cambia **URL del endpoint** a `/api/inscripciones/registro` y **Recurso** a `Registro de inscripciones`, y pulsa **Guardar**. Verás el toast verde con título **`Permiso actualizado`** y detalle exacto: **`POST /api/inscripciones/registro`**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i -X PUT http://localhost:8181/api/permissions/59 \
    -H "Authorization: Bearer <TOKEN_ADMIN>" \
    -H "Content-Type: application/json" \
    -d '{"method":"POST","url":"/api/inscripciones/registro","module":"Gestión Deportiva","resource":"Registro de inscripciones"}'
  # HTTP/1.1 200 OK
  ```
- **Qué debe mostrar la captura:** La fila y el panel **Detalle del permiso** actualizados con `POST /api/inscripciones/registro` y el toast verde `Permiso actualizado`.

---

### HU-SE-05 · Criterio 8: Se debe permitir eliminar un permiso cuando las reglas del sistema lo permitan.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/controller/PermissionController.java:58-62` (`DELETE /api/permissions/{id}` -> `204 No Content`) y `backend/src/main/java/com/fac/backend/service/PermissionService.java:83-94`.
  - **Frontend:** `frontend/app/(main)/permisos/page.tsx:341-389`.
  ```java
  // PermissionService.java:87-94
  public void delete(Long id) {
      findPermission(id);
      if (rolePermissionRepository.existsByPermissionId(id)) {
          throw new ApplicationException(ErrorCase.INVALID_OPERATION,
                  "No se puede eliminar un permiso que está asignado");
      }
      permissionRepository.deleteById(id);
  }
  ```
  Si el permiso NO está asignado a ningún rol, permite eliminarlo; si está asignado a uno o más roles, lo bloquea con `400 Bad Request` y el mensaje exacto **`No se puede eliminar un permiso que está asignado`**.
- **Prueba paso a paso (para captura de pantalla):**
  1. **Caso bloqueado (con roles asignados):** En `/permisos`, intenta eliminar `GET /api/torneos` pulsando 🗑️ > **Eliminar**. Verás el toast rojo **`No se puede eliminar el permiso: No se puede eliminar un permiso que está asignado`** y la tarjeta de alerta roja: **`No se puede eliminar 'Listar Torneos' porque está asignado a uno o más roles.`**.
  2. **Caso permitido (sin roles asignados):** En la fila del permiso nuevo `POST /api/inscripciones/registro` (que tiene `0` roles asociados), pulsa 🗑️ > **Eliminar**. Verás el toast verde con título **`Permiso eliminado`** y detalle exacto: **`Se eliminó POST /api/inscripciones/registro.`**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  # Bloqueado (asignado a ADMIN):
  curl -i -X DELETE http://localhost:8181/api/permissions/1 -H "Authorization: Bearer <TOKEN_ADMIN>"
  # HTTP/1.1 400 Bad Request -> {"message":"No se puede eliminar un permiso que está asignado",...}

  # Permitido (no asignado):
  curl -i -X DELETE http://localhost:8181/api/permissions/59 -H "Authorization: Bearer <TOKEN_ADMIN>"
  # HTTP/1.1 204 No Content
  ```
- **Qué debe mostrar la captura:** Una captura con la alerta roja al intentar borrar un permiso asignado y otra con el toast verde `Permiso eliminado` al borrar un permiso sin roles asociados.

---

### HU-SE-05 · Criterio 9: Se debe evitar registrar permisos duplicados para la misma operación y recurso.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/entity/Permission.java:25-28` (`@UniqueConstraint(name = "uk_permissions_url_method", columnNames = {"url", "method"})`) y `backend/src/main/java/com/fac/backend/service/PermissionService.java:39-44, 73-78, 116-128`.
  ```java
  // PermissionService.java:39-44
  normalize(dto);
  if (permissionRepository.existsByUrlAndMethod(dto.getUrl(), dto.getMethod())) {
      throw new ApplicationException(ErrorCase.ALREADY_EXISTS,
              "Ya existe un permiso con esa url y método");
  }
  ```
  Como `normalize(dto)` convierte `/api/torneos/1`, `/api/torneos/?` y `/api/torneos/{id}/` a `/api/torneos/{id}` y el método a mayúsculas antes de consultar `existsByUrlAndMethod`, impide duplicar la misma operación sobre el mismo recurso incluso si se escribe con un ID numérico o barra final.
- **Prueba paso a paso (para captura de pantalla):** En **Seguridad > Permisos** (`/permisos`), pulsa **`+ Nuevo permiso`**, deja `GET (Listar / Ver)` y `/api/torneos` (o escribe `/api/torneos/15` con `GET`) y pulsa **Guardar**. En el modal aparece el banner rojo con el mensaje exacto: **`Ya existe un permiso con esa url y método`**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i -X POST http://localhost:8181/api/permissions \
    -H "Authorization: Bearer <TOKEN_ADMIN>" \
    -H "Content-Type: application/json" \
    -d '{"method":"get","url":"/api/torneos/99/"}'
  # HTTP/1.1 409 Conflict -> {"status":409,"errorCase":"ALREADY_EXISTS","message":"Ya existe un permiso con esa url y método",...}
  ```
- **Qué debe mostrar la captura:** El modal **Registrar permiso** mostrando el banner de error rojo `Ya existe un permiso con esa url y método`.

---

### HU-SE-05 · Criterio 10: La eliminación de un permiso no debe eliminar los roles existentes en el sistema.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/entity/Permission.java:67-69` (`@OneToMany(mappedBy = "permission", fetch = FetchType.LAZY)` sin `CascadeType.REMOVE` hacia `Role`) y `backend/src/main/java/com/fac/backend/service/PermissionService.java:87-94`.
- **Prueba paso a paso (para captura de pantalla):**
  1. Crea un permiso de prueba `GET /api/estadisticas-test`, asígnalo al rol `CONSULTOR` en `/roles/permisos` y guarda.
  2. Luego desmárcalo de `CONSULTOR` en `/roles/permisos` y guarda (retirando la asociación), ve a `/permisos` y elimina `GET /api/estadisticas-test`.
  3. Ve a **Seguridad > Roles** (`/roles`): verifica que el rol `CONSULTOR` y los demás 6 roles siguen intactos.
- **Prueba alterna (si no se ve en la UI):**
  ```sql
  SELECT COUNT(*) AS total_roles FROM roles;
  -- Permanece idéntico antes y después de eliminar el permiso.
  ```
- **Qué debe mostrar la captura:** La vista `/roles` (o consulta SQL) demostrando que todos los roles siguen existiendo tras eliminar el permiso.

---

## 5. HU-SE-06 — Asignar permisos a roles (Matriz RBAC)

### HU-SE-06 · Criterio 1: El rol y los permisos deben estar previamente registrados.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/service/RolePermissionService.java:54-60` (en `assign`) y `:153-189` (en `syncPermissions`).
  ```java
  // RolePermissionService.java:153-157, 174-189
  Role role = roleRepository.findById(roleId)
          .orElseThrow(() -> new ApplicationException(
                  ErrorCase.NOT_FOUND, "Rol no encontrado con id: " + roleId));
  ...
  if (!missingIds.isEmpty()) {
      throw new ApplicationException(
              ErrorCase.INVALID_OPERATION, "No existen los permisos con id: " + missingIds);
  }
  ```
  Valida en una sola consulta (`permissionRepository.findAllById(requestedIds)`) que todos los IDs de permiso enviados existan y que el rol exista.
- **Prueba paso a paso (para captura de pantalla):** Si aún no hubiera permisos o roles, la vista `/roles/permisos` muestra los estados controlados **`No hay roles registrados. Crea un rol antes de asignar permisos.`** (`page.tsx:301`) o **`Todavía no hay permisos registrados`** (`PermissionMatrix.tsx:126`).
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  # Rol inexistente (404):
  curl -i -X PUT http://localhost:8181/api/roles/9999/permissions \
    -H "Authorization: Bearer <TOKEN_ADMIN>" -H "Content-Type: application/json" \
    -d '{"permissionIds":[1]}'
  # HTTP/1.1 404 Not Found -> {"message":"Rol no encontrado con id: 9999"}

  # Permiso inexistente (400):
  curl -i -X PUT http://localhost:8181/api/roles/2/permissions \
    -H "Authorization: Bearer <TOKEN_ADMIN>" -H "Content-Type: application/json" \
    -d '{"permissionIds":[9999]}'
  # HTTP/1.1 400 Bad Request -> {"message":"No existen los permisos con id: [9999]"}
  ```
- **Qué debe mostrar la captura:** Respuesta `404 Not Found` (`Rol no encontrado con id: 9999`) y `400 Bad Request` (`No existen los permisos con id: [9999]`) en Postman/cURL.

---

### HU-SE-06 · Criterio 2: El sistema debe permitir seleccionar un rol desde la interfaz.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Frontend:** `frontend/app/(main)/roles/permisos/components/RoleSelector.tsx:22-112` y `frontend/app/(main)/roles/permisos/page.tsx:246-270, 356-362`.
  ```tsx
  // RoleSelector.tsx:30-46
  <Dropdown
      inputId="role-selector"
      value={value}
      options={roles}
      optionLabel="name"
      optionValue="id"
      filter
      filterBy="name"
      placeholder="Selecciona un rol" ...
  ```
  Además, si hay cambios sin guardar (`dirty === true`) y el usuario intenta cambiar de rol, lanza un `confirmDialog` con el texto exacto: **`Tienes cambios sin guardar. Si cambias de rol, se perderán. ¿Deseas continuar?`**.
- **Prueba paso a paso (para captura de pantalla):** Ve a **Seguridad > Asignar permisos** (`/roles/permisos`). Haz clic en el desplegable **`Rol seleccionado`** arriba a la izquierda: verás la lista de roles (`ADMIN`, `AFICIONADO`, `CONSULTOR`, `COORDINADOR`, `JUEZ DEPORTIVO`, `OPERADOR`) con buscador integrado y un check azul en el rol activo.
- **Prueba alterna (si no se ve en la UI):** También soporta selección directa por query param: `/roles/permisos?roleId=2`.
- **Qué debe mostrar la captura:** El desplegable **Rol seleccionado** abierto mostrando todos los roles y el filtro de búsqueda.

---

### HU-SE-06 · Criterio 3: Al seleccionar un rol, el sistema debe mostrar los permisos que tiene actualmente asignados.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/controller/RoleController.java:57-65` (`GET /api/roles/{id}/permissions` y `GET /api/roles/{id}/summary`).
  - **Frontend:** `frontend/app/(main)/roles/permisos/hooks/useRolePermissions.ts:59-85`.
  ```ts
  // useRolePermissions.ts:64-75
  const [assignmentData, summaryData] = await Promise.all([
      fetchRolePermissions(roleId),
      fetchRoleSummary(roleId)
  ]);
  const ids = new Set(assignmentData.permissionIds);
  setSelectedIds(new Set(ids));
  setSavedIds(new Set(ids));
  ```
- **Prueba paso a paso (para captura de pantalla):** En `/roles/permisos`, selecciona **`COORDINADOR`** en **Rol seleccionado** (o pulsa el botón **`Cargar permisos`**). Observa cómo la matriz marca automáticamente los **4 permisos** de `COORDINADOR` (`Listar` en `Torneos`, `Equipos`, `Jugadores` y `Partidos`) y el panel derecho **Resumen del rol** muestra **`Total permisos asignados: 4`**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/roles/2/permissions -H "Authorization: Bearer <TOKEN_ADMIN>"
  # HTTP 200 OK -> {"roleId":2,"roleName":"COORDINADOR","permissionIds":[...],"totalAssigned":4,"totalAvailable":58}
  ```
- **Qué debe mostrar la captura:** El rol `COORDINADOR` seleccionado con sus 4 checkboxes marcados en la matriz y `Asignados: 4` en el panel derecho.

---

### HU-SE-06 · Criterio 4: Los permisos deben visualizarse agrupados por módulo o recurso del sistema.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/service/PermissionCatalogService.java:56-72, 177-203` construye la jerarquía `PermissionModuleDTO -> List<PermissionResourceDTO> -> List<PermissionItemDTO>` ordenada según `MODULE_ORDER` (`Administración`, `Gestión Deportiva`, `Comercial`, `Infraestructura`, `Reportes`, `Seguridad`).
  - **Frontend:** `frontend/app/(main)/roles/permisos/components/PermissionMatrix.tsx:190-272` renderiza encabezados de grupo colapsables por cada **Módulo** con contador `X/Y asignados` y debajo las filas de cada **Recurso**.
- **Prueba paso a paso (para captura de pantalla):** En `/roles/permisos`, observa las filas de agrupación de módulo en la tabla (`Administración`, `Gestión Deportiva`, `Comercial`, `Infraestructura`, `Reportes`, `Seguridad`) con su contador `X/Y asignados`, su checkbox maestro de módulo y las filas de recursos con íconos debajo de cada módulo.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/permissions/catalog -H "Authorization: Bearer <TOKEN_ADMIN>"
  ```
- **Qué debe mostrar la captura:** La matriz mostrando claramente los encabezados de módulo (`Administración`, `Gestión Deportiva`, etc.) agrupando sus respectivos recursos.

---

### HU-SE-06 · Criterio 5: La visualización debe realizarse mediante una matriz de permisos similar al mockup.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Frontend:** `frontend/app/(main)/roles/permisos/page.tsx:347-475`, `PermissionMatrix.tsx:163-447` y `RoleSummaryPanel.tsx:30-195`.
  Conserva exactamente la disposición estructural del mockup `context-project/Mockups/1_HU-SE-06 .png`:
  1. Barra superior con selector de rol y botones **`Cargar permisos`**, **`Guardar cambios`** y **`Restablecer`**.
  2. Tabla consolidada a la izquierda (`col-12 lg:col-8`) con columnas **`Recurso | Ver | Listar | Crear | Actualizar | Eliminar`** y checkboxes por celda y por módulo.
  3. Panel lateral derecho (`col-12 lg:col-4`) **Resumen del rol** con `Nombre del rol`, `Estado`, `Usuarios asociados`, `Total permisos asignados`, `Módulos con acceso`, las 3 cajas KPI (`Total permisos disponibles`, `Asignados`, `No asignados`), `Leyenda`, `Reglas de acceso` y el aviso amarillo **`Retirar un permiso del rol no elimina el permiso del sistema.`**.
- **Prueba paso a paso (para captura de pantalla):** Abre `/roles/permisos` en pantalla completa (`1920x1080` o zoom `90%`) con el rol `ADMIN` o `COORDINADOR` seleccionado para que se vean completos el selector superior, la matriz a la izquierda y el panel **Resumen del rol** a la derecha.
- **Prueba alterna (si no se ve en la UI):** N/A (criterio visual de estructura de interfaz).
- **Qué debe mostrar la captura:** Vista general de `/roles/permisos` mostrando la estructura idéntica al mockup `1_HU-SE-06 .png`.

---

### HU-SE-06 · Criterio 6: Cada recurso podrá presentar operaciones como Ver, Listar, Crear, Actualizar y Eliminar.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Cómo tu modelo HTTP (`GET`, `POST`, `PUT`/`PATCH`, `DELETE`) cubre las 5 operaciones del mockup:**
    En `backend/src/main/java/com/fac/backend/service/PermissionCatalogService.java:111-129`, cada permiso `(method, url)` se traduce de forma determinística a una de las 5 operaciones de negocio (`PermissionOperation`):
    - **`LISTAR` ("Listar"):** `GET` sobre la ruta de colección sin identificador (ej. `GET /api/torneos`, `GET /api/roles`).
    - **`VER` ("Ver"):** `GET` sobre una ruta con segmento identificador `{id}` o `?` (ej. `GET /api/torneos/{id}`, `GET /api/roles/{id}`).
    - **`CREAR` ("Crear"):** `POST` sobre el recurso (ej. `POST /api/torneos`, `POST /api/roles`).
    - **`ACTUALIZAR` ("Actualizar"):** `PUT` o `PATCH` sobre el recurso (ej. `PUT /api/torneos/{id}`, `PATCH /api/users/{id}/status`).
    - **`ELIMINAR` ("Eliminar"):** `DELETE` sobre el recurso (ej. `DELETE /api/torneos/{id}`, `DELETE /api/roles/{id}`).
  - En `PermissionMatrix.tsx:17-26` las columnas de la tabla son exactamente `Ver | Listar | Crear | Actualizar | Eliminar`, y si una celda agrupa más de un endpoint técnico (por ejemplo `Roles -> Ver` agrupa `GET /api/roles/{id}`, `GET /api/roles/{id}/permissions`, `GET /api/roles/{id}/summary`, `GET /api/roles/{id}/detail-with-permissions`), muestra el contador `selectedCount/permissions.length` (ej. `4/4`) con el tooltip de los endpoints HTTP exactos.
- **Prueba paso a paso (para captura de pantalla):** En `/roles/permisos`, observa las cabeceras de la tabla **`Recurso | Ver | Listar | Crear | Actualizar | Eliminar`** y pasa el cursor sobre el contador `4/4` de la fila `Roles` en la columna `Ver` para ver el tooltip con los endpoints `GET` que componen esa operación.
- **Prueba alterna (si no se ve en la UI):** Revisar `GET /api/permissions/catalog` donde cada permiso tiene `"operation": "VER" | "LISTAR" | "CREAR" | "ACTUALIZAR" | "ELIMINAR"`.
- **Qué debe mostrar la captura:** Las 5 columnas `Ver`, `Listar`, `Crear`, `Actualizar`, `Eliminar` en el encabezado de la matriz y las filas de recursos debajo.

---

### HU-SE-06 · Criterio 7: El administrador debe poder asignar permisos a un rol marcando las opciones correspondientes.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Frontend:** `frontend/app/(main)/roles/permisos/components/PermissionMatrix.tsx:244-251, 386-400` y `hooks/useRolePermissions.ts:132-150`.
  ```ts
  // useRolePermissions.ts:137-143
  permissionIds.forEach((permissionId) => {
      if (checked) {
          next.add(permissionId);
      } else {
          next.delete(permissionId);
      }
  });
  ```
- **Prueba paso a paso (para captura de pantalla):** En `/roles/permisos`, selecciona el rol **`OPERADOR`** (que inicia con `0` permisos asignados y muestra el banner azul **`Este rol no tiene permisos asignados actualmente.`**). Marca las casillas `Ver`, `Listar` y `Crear` de **`Entradas`** (módulo `Comercial`) y de **`Escenarios`** (módulo `Infraestructura`). Observa cómo el panel derecho **Resumen del rol** pasa en tiempo real a **`Asignados: 6`**, aparece el tag amarillo **`Sin guardar`** y se habilita el botón **`Guardar cambios`**.
- **Prueba alterna (si no se ve en la UI):** `PUT /api/roles/3/permissions` enviando los IDs marcados en `permissionIds`.
- **Qué debe mostrar la captura:** Las casillas marcadas en la matriz para `OPERADOR`, el tag amarillo `Sin guardar` en el panel derecho y el botón `Guardar cambios` habilitado.

---

### HU-SE-06 · Criterio 8: El administrador debe poder retirar permisos de un rol desmarcando las opciones correspondientes.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Frontend:** `useRolePermissions.ts:141` (`next.delete(permissionId)`) y `RolePermissionService.java:202-205, 217-219` (`rolePermissionRepository.deleteAll(removals)`).
- **Prueba paso a paso (para captura de pantalla):** En `/roles/permisos`, selecciona **`COORDINADOR`** (que tiene `4` permisos marcados en `Gestión Deportiva`). Desmarca la casilla **`Listar`** de la fila **`Partidos`**. Observa que el contador del módulo baja a `3/20 asignados`, el KPI **Asignados** baja a `3`, aparece el badge **`Sin guardar`** y al pulsar **`Guardar cambios`** aparece el toast verde **`Permisos actualizados correctamente.: Los cambios aplican a todos los usuarios con este rol.`**.
- **Prueba alterna (si no se ve en la UI):** `DELETE /api/role-permissions/{roleId}/{permissionId}` o `PUT /api/roles/{id}/permissions` omitiendo el ID desmarcado.
- **Qué debe mostrar la captura:** La casilla desmarcada en la matriz y el banner/toast verde `Permisos actualizados correctamente.`.

---

### HU-SE-06 · Criterio 9: Un rol puede tener varios permisos asignados.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `Role.java:65-67` (`@OneToMany(mappedBy = "role") private List<RolePermission> rolePermissions`) y `DatabaseSeeder.java:32-118` (asigna los 58 permisos al rol `ADMIN`).
- **Prueba paso a paso (para captura de pantalla):** En `/roles/permisos`, selecciona el rol **`ADMIN`**: observa los **58 permisos** marcados simultáneamente en todos los módulos (`Administración`, `Gestión Deportiva`, `Comercial`, `Infraestructura`, `Reportes`, `Seguridad`) y el KPI **`Asignados: 58`**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/roles/1/permissions -H "Authorization: Bearer <TOKEN_ADMIN>"
  # "totalAssigned": 58
  ```
- **Qué debe mostrar la captura:** La matriz con `ADMIN` seleccionado mostrando `Asignados: 58` y múltiples módulos completos marcados.

---

### HU-SE-06 · Criterio 10: Un mismo permiso puede estar asignado a varios roles.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `Permission.java:67-69` (`@OneToMany(mappedBy = "permission") private List<RolePermission> rolePermissions`) y `RolePermissionController.java:44-48` (`GET /api/role-permissions/permissions/{permissionId}`).
  - **Frontend:** Panel derecho de `/permisos` (`frontend/app/(main)/permisos/page.tsx:700-740`) que muestra `Roles que incluyen este permiso` y los tags de cada rol.
- **Prueba paso a paso (para captura de pantalla):** Ve a **Seguridad > Permisos** (`/permisos`), haz clic sobre el permiso **`Listar Torneos` (`GET /api/torneos`)**. En el panel derecho **Detalle del permiso**, observa **`Roles que incluyen este permiso: 2`** y los tags **`● ADMIN`** y **`● COORDINADOR`**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/role-permissions/permissions/30 -H "Authorization: Bearer <TOKEN_ADMIN>"
  # Devuelve las asociaciones del mismo permiso con ADMIN y COORDINADOR
  ```
- **Qué debe mostrar la captura:** El panel derecho **Detalle del permiso** en `/permisos` mostrando `Roles que incluyen este permiso: 2` (`● ADMIN`, `● COORDINADOR`).

---

### HU-SE-06 · Criterio 11: No se debe duplicar la asociación de un mismo permiso dentro del mismo rol.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:**
    1. En BD: `backend/src/main/java/com/fac/backend/entity/RolePermission.java:19-22` (`@UniqueConstraint(name = "uk_role_permission", columnNames = {"role_id", "permission_id"})`).
    2. En asignación individual (`RolePermissionService.java:61-65`): lanza `409 Conflict` con **`El rol ya tiene asignado ese permiso`**.
    3. En sincronización de matriz (`RolePermissionService.java:167-172`): valida `if (new HashSet<>(requestedIds).size() != requestedIds.size())` y lanza `400 Bad Request` con **`No se permiten permisos duplicados`**.
- **Prueba paso a paso (para captura de pantalla):** En el frontend `selectedIds` es un `Set<number>` (`useRolePermissions.ts:51`), por lo que en la interfaz nunca se envían IDs repetidos. Para evidenciar el bloqueo del backend en captura, ejecuta la petición en Postman/cURL enviando `[1, 1]`.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  # En el endpoint de la matriz:
  curl -i -X PUT http://localhost:8181/api/roles/2/permissions \
    -H "Authorization: Bearer <TOKEN_ADMIN>" -H "Content-Type: application/json" \
    -d '{"permissionIds":[1, 1]}'
  # HTTP/1.1 400 Bad Request -> {"status":400,"errorCase":"INVALID_OPERATION","message":"No se permiten permisos duplicados"}

  # En el endpoint individual:
  curl -i -X POST http://localhost:8181/api/role-permissions \
    -H "Authorization: Bearer <TOKEN_ADMIN>" -H "Content-Type: application/json" \
    -d '{"roleId":1,"permissionId":1}'
  # HTTP/1.1 409 Conflict -> {"status":409,"errorCase":"ALREADY_EXISTS","message":"El rol ya tiene asignado ese permiso"}
  ```
- **Qué debe mostrar la captura:** Respuesta de Postman/terminal mostrando `400 Bad Request: No se permiten permisos duplicados` y `409 Conflict: El rol ya tiene asignado ese permiso`.

---

### HU-SE-06 · Criterio 12: La matriz debe reflejar correctamente los permisos activos e inactivos del rol seleccionado (marcar solo lo realmente asignado).
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Frontend:** `frontend/app/(main)/roles/permisos/components/PermissionMatrix.tsx:323-381`.
  ```tsx
  // PermissionMatrix.tsx:323-334, 371-381
  const selectedCount = permissions.filter((permission) => selectedIds.has(permission.id)).length;
  const allSelected = selectedCount === permissions.length;
  ...
  element.indeterminate = selectedCount > 0 && !allSelected;
  checked={allSelected}
  ```
  Cada casilla evalúa únicamente `selectedIds.has(permission.id)`. Si un recurso tiene varios permisos en una misma columna y solo algunos están asignados, muestra estado indeterminado (`indeterminate`) y el contador exacto `selectedCount/permissions.length`; si un recurso no tiene endpoint para una operación, el checkbox aparece deshabilitado (`disabled`).
- **Prueba paso a paso (para captura de pantalla):** En `/roles/permisos`, alterna entre:
  - **`ADMIN`** (`58` asignados, `0` no asignados: todas las casillas disponibles marcadas).
  - **`CONSULTOR`** (`2` asignados, `56` no asignados: solo `Ver` y `Listar` de `Usuarios` están marcados; el resto desmarcados).
  - **`AFICIONADO`** (`0` asignados, `58` no asignados: todas las casillas desmarcadas y el aviso `Este rol no tiene permisos asignados actualmente.`).
- **Prueba alterna (si no se ve en la UI):** `GET /api/roles/4/permissions` devuelve exactamente los 2 IDs asignados a `CONSULTOR`.
- **Qué debe mostrar la captura:** La matriz con `CONSULTOR` seleccionado mostrando únicamente `Ver` y `Listar` marcados en la fila `Usuarios` y `Asignados: 2` / `No asignados: 56` en el panel derecho.

---

### HU-SE-06 · Criterio 13: Los cambios realizados sobre la matriz de permisos deben poder guardarse mediante una acción de actualización o guardado.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/controller/RoleController.java:67-84` (`PUT /api/roles/{id}/permissions`) y `backend/src/main/java/com/fac/backend/service/RolePermissionService.java:138-240`.
  - **Frontend:** Botón **`Guardar cambios`** en `frontend/app/(main)/roles/permisos/page.tsx:373-383` que invoca `persist()` (`:183-195`).
  ```java
  // RolePermissionService.java:138-147, 217-222
  @CacheEvict(cacheNames = CacheConfig.EFFECTIVE_PERMISSIONS_CACHE, allEntries = true)
  @Transactional
  public RolePermissionsAssignmentDTO syncPermissions(Long roleId, UpdateRolePermissionsRequestDTO dto, ...) {
      ...
      if (!removals.isEmpty()) { rolePermissionRepository.deleteAll(removals); }
      if (!additions.isEmpty()) { rolePermissionRepository.saveAll(additions); }
  ```
  Es una operación atómica (`@Transactional`) que calcula en memoria las altas (`additions`) y bajas (`removals`) sin hacer consultas en ciclos `for`, registra auditoría en `AuditLog` e invalida la caché de permisos efectivos.
- **Prueba paso a paso (para captura de pantalla):** En `/roles/permisos`, selecciona `OPERADOR`, marca los permisos de `Entradas` y pulsa el botón **`Guardar cambios`**. Aparecerá:
  1. El banner verde debajo de la barra superior con el texto exacto: **`Permisos actualizados correctamente.`**.
  2. El toast verde con título **`Permisos actualizados correctamente.`** y detalle exacto: **`Los cambios aplican a todos los usuarios con este rol.`**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i -X PUT http://localhost:8181/api/roles/3/permissions \
    -H "Authorization: Bearer <TOKEN_ADMIN>" -H "Content-Type: application/json" \
    -d '{"permissionIds":[46,47,48]}'
  # HTTP/1.1 200 OK
  ```
- **Qué debe mostrar la captura:** El banner verde `Permisos actualizados correctamente.` y el toast `Los cambios aplican a todos los usuarios con este rol.`.

---

### HU-SE-06 · Criterio 14: Retirar un permiso de un rol no debe eliminar el permiso del sistema.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `RolePermissionService.java:217-219` ejecuta `rolePermissionRepository.deleteAll(removals)` sobre la entidad intermedia `RolePermission` (la cual tiene `@ManyToOne(fetch = FetchType.LAZY)` sin `CascadeType.REMOVE` hacia `Permission`).
  - **Frontend:** En el panel derecho de `/roles/permisos` (`RoleSummaryPanel.tsx:194-198`) se informa permanentemente: **`Retirar un permiso del rol no elimina el permiso del sistema.`**.
- **Prueba paso a paso (para captura de pantalla):**
  1. En `/roles/permisos`, selecciona `OPERADOR`, desmarca todos sus permisos y pulsa **`Guardar cambios`**.
  2. Observa en el panel derecho que **`Total permisos disponibles`** sigue siendo **`58`** (y en **Seguridad > Permisos** `/permisos` siguen listados los 58 permisos).
- **Prueba alterna (si no se ve en la UI):**
  ```sql
  SELECT (SELECT COUNT(*) FROM permissions) AS PermisosEnCatalogo,
         (SELECT COUNT(*) FROM role_permissions WHERE role_id = 3) AS PermisosDeOperador;
  -- PermisosEnCatalogo sigue en 58 aunque PermisosDeOperador quede en 0.
  ```
- **Qué debe mostrar la captura:** El panel derecho de `/roles/permisos` con `Asignados: 0`, `Total permisos disponibles: 58` y el mensaje amarillo `Retirar un permiso del rol no elimina el permiso del sistema.`.

---

### HU-SE-06 · Criterio 15: Los cambios realizados sobre los permisos de un rol deben aplicarse a los usuarios que tengan asignado dicho rol.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `RolePermissionService.syncPermissions` (`:138-141`) tiene `@CacheEvict(cacheNames = CacheConfig.EFFECTIVE_PERMISSIONS_CACHE, allEntries = true)`. Como `allEntries = true` vacía la caché de todos los usuarios, la siguiente petición de cualquier usuario que tenga ese rol vuelve a ejecutar `PermissionRepository.findAllByUserId(userId)` obteniendo los nuevos permisos inmediatamente.
- **Prueba paso a paso (para captura de pantalla):**
  1. Asegúrate de que el usuario `Carlos Pérez` tenga asignado únicamente el rol `COORDINADOR`.
  2. En `/roles/permisos` (como Admin), selecciona `COORDINADOR`, marca la casilla **`Listar`** de **`Roles`** (`GET /api/roles`) y pulsa **`Guardar cambios`**.
  3. Ve a `/usuarios/2/roles` (o consulta `GET /api/auth/me` con el token de `Carlos Pérez`): verás que `Carlos Pérez` ahora tiene el permiso **`Listar Roles` (`GET /api/roles`)** en su lista de permisos efectivos.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -s http://localhost:8181/api/auth/me -H "Authorization: Bearer <TOKEN_CARLOS>"
  # Incluye inmediatamente el nuevo permiso agregado al rol COORDINADOR
  ```
- **Qué debe mostrar la captura:** El panel **Permisos efectivos** del usuario (o respuesta de `/api/auth/me`) mostrando el nuevo permiso heredado automáticamente tras actualizar el rol en la matriz.

---

### HU-SE-06 · Criterio 16: Si ninguno de los roles del usuario posee el permiso requerido, la operación debe ser denegada.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/authorization/DynamicAuthorizationManager.java:64-76`. Cuando `anyMatch` da `false`, devuelve `new AuthorizationDecision(false)` y Spring Security responde **`403 Forbidden`**.
  - **Frontend:** `frontend/layout/ProtectedRoute.tsx:73-83` renderiza el componente `<AccessDenied />` (`frontend/layout/AccessDenied.tsx`) con el mensaje **`Acceso restringido: Tu cuenta no tiene los permisos necesarios para abrir esta sección...`**.
- **Prueba paso a paso (para captura de pantalla):** Inicia sesión con un usuario que solo tenga el rol **`AFICIONADO`** (0 permisos administrativos) y escribe en la barra de direcciones del navegador `http://localhost:3000/roles`. Verás la pantalla de bloqueo **`Acceso restringido`** con el subtítulo **`Tu cuenta no tiene los permisos necesarios para abrir esta sección. Si necesitas este acceso, pídele a un administrador que actualice los permisos de tu rol.`** y los botones `Volver al inicio` y `Volver a comprobar`.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i http://localhost:8181/api/roles -H "Authorization: Bearer <TOKEN_AFICIONADO>"
  # HTTP/1.1 403 Forbidden
  ```
- **Qué debe mostrar la captura:** La pantalla `Acceso restringido` en el frontend al intentar abrir `/roles` y/o la respuesta `HTTP/1.1 403 Forbidden` en Postman/cURL contra `GET /api/roles`.

---

### HU-SE-06 · Criterio 17: Si al menos uno de los roles del usuario posee el permiso requerido, la operación debe ser permitida.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/repository/PermissionRepository.java:38-48` (`SELECT DISTINCT p FROM Permission p JOIN p.rolePermissions rp JOIN rp.role r JOIN r.userRoles ur WHERE ur.user.id = :userId AND ur.user.enabled = true AND r.active = true`) une los permisos de todos los roles activos del usuario, y `DynamicAuthorizationManager.java:68-73` evalúa `.anyMatch(...)`.
- **Prueba paso a paso (para captura de pantalla):**
  1. Asigna al usuario `Carlos Pérez` dos roles: **`AFICIONADO`** (que no tiene permisos) y **`CONSULTOR`** (que sí tiene `GET /api/users` y `GET /api/users/{id}`).
  2. Inicia sesión como `Carlos Pérez` y entra a **Seguridad > Usuarios** (`/usuarios`). Aunque su rol `AFICIONADO` no tiene el permiso, como su segundo rol `CONSULTOR` sí lo posee, el backend responde **`200 OK`** y la tabla de usuarios se carga normalmente.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i http://localhost:8181/api/users -H "Authorization: Bearer <TOKEN_CARLOS_CON_AFICIONADO_Y_CONSULTOR>"
  # HTTP/1.1 200 OK
  ```
- **Qué debe mostrar la captura:** El usuario con dos roles (`AFICIONADO` + `CONSULTOR`) accediendo exitosamente (`200 OK`) a la vista `/usuarios`.

---

### HU-SE-06 · Criterio 18: Los permisos asignados deben mantenerse después de cerrar sesión e iniciar sesión nuevamente.
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `RolePermissionService.syncPermissions` guarda en la tabla MySQL `role_permissions` mediante JPA (`rolePermissionRepository.saveAll(additions)`). Al iniciar sesión nuevamente (`POST /api/auth/login`) y llamar a `GET /api/auth/me` (`AuthService.java:160-180`), los permisos se leen directamente desde MySQL.
  - **Frontend:** En `/roles/permisos` (`page.tsx:440-444`) se muestra el mensaje informativo: **`Los permisos seleccionados se conservarán después de cerrar e iniciar sesión nuevamente.`**.
- **Prueba paso a paso (para captura de pantalla):**
  1. Como `admin@uc.edu.co`, en `/roles/permisos`, selecciona `OPERADOR`, marca las 5 operaciones de **`Entradas`**, pulsa **`Guardar cambios`** y verifica que dice **`Asignados: 5`**.
  2. En la barra superior derecha, abre el menú del usuario y pulsa **`Cerrar sesión`**.
  3. Vuelve a iniciar sesión con `admin@uc.edu.co`, entra a **Seguridad > Asignar permisos** (`/roles/permisos`) y selecciona `OPERADOR`: las 5 casillas de **`Entradas`** siguen marcadas y **`Asignados: 5`** se mantiene intacto.
- **Prueba alterna (si no se ve en la UI):**
  ```sql
  SELECT rp.id, r.name AS rol, p.method, p.url
  FROM role_permissions rp
  JOIN roles r ON r.id = rp.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE r.name = 'OPERADOR';
  ```
- **Qué debe mostrar la captura:** La matriz de `OPERADOR` tras volver a iniciar sesión (y/o el `SELECT` en MySQL) conservando los 5 permisos guardados.

---

## 6. EXTRAS DE MI PARTE (Fercho · Persona C)

### EXTRA 1 · Autorización dinámica en Capa 7 OSI (`token → userId → permisos efectivos → PermissionMatcher → 200/403` y prueba de `/api/roles/15` vs `/api/roles/abc`)
- **Estado:** ✅ cumple
- **Implementación técnica:**
  1. **Token JWT → `userId`:** `SecurityConfig.java:63-74` valida la firma del JWT y `SessionTokenValidator` verifica que la sesión siga activa en BD; `authentication.getName()` contiene el `sub` (`userId` numérico del usuario).
  2. **Filtro de precarga por request:** `backend/src/main/java/com/fac/backend/security/EffectivePermissionsFilter.java:38-51` extrae `Long userId = Long.valueOf(authentication.getName())`, invoca `effectivePermissionService.findByUserId(userId)` y adjunta la lista en el atributo `EffectivePermissionsFilter.PERMISSIONS_ATTRIBUTE` del `HttpServletRequest`.
  3. **Permisos efectivos con caché y Triple JOIN:** `EffectivePermissionService.java:17-21` (`@Cacheable(cacheNames = "effectivePermissions", key = "#userId")`) ejecuta `PermissionRepository.findAllByUserId(userId)` (`Permission -> RolePermission -> Role -> UserRole`).
  4. **Guardián `DynamicAuthorizationManager` + `PermissionMatcher`:** `backend/src/main/java/com/fac/backend/authorization/DynamicAuthorizationManager.java:64-76` y `PermissionMatcher.java:10-46`:
     ```java
     // PermissionMatcher.java:15-18, 35-46
     String normalized = requestUrl.replaceAll(
             "(?i)(?<=/)(?:\\d+|[a-f0-9]{24}|\\?)(?=/|$)",
             "{id}"
     );
     ...
     public static boolean matches(Permission permission, String httpMethod, String requestUrl) {
         if (permission == null || permission.getMethod() == null || httpMethod == null || requestUrl == null) {
             return false;
         }
         return permission.getMethod().equalsIgnoreCase(httpMethod)
                 && normalizeUrl(permission.getUrl()).equals(normalizeUrl(requestUrl));
     }
     ```
     - Si el permiso en BD es `GET /api/roles/?` o `GET /api/roles/{id}`, `normalizeUrl(...)` produce `"/api/roles/{id}"`.
     - Cuando llega `GET /api/roles/15`, `normalizeUrl("/api/roles/15")` reemplaza el segmento numérico `15` por `{id}` → `"/api/roles/{id}"` → **hace match (`true` → `200 OK`)**.
     - Cuando llega `GET /api/roles/abc`, `abc` no es un número (`\d+`) ni un ObjectId de 24 hex (`[a-f0-9]{24}`), por lo que `normalizeUrl("/api/roles/abc")` queda `"/api/roles/abc"` ≠ `"/api/roles/{id}"` → **NO hace match (`false` → `403 Forbidden`)**.
- **Prueba paso a paso y alterna (para captura de pantalla):**
  1. **Con cURL / Postman en vivo:**
     ```bash
     # 1) /api/roles/1 (o /api/roles/15) -> Segmento numérico hace match con /api/roles/{id} (o /api/roles/?):
     curl -i http://localhost:8181/api/roles/1 -H "Authorization: Bearer <TOKEN_ADMIN>"
     # HTTP/1.1 200 OK (o 404 Not Found si el id 15 no existe, lo que demuestra que PASÓ el guardián de seguridad)

     # 2) /api/roles/abc -> Segmento no numérico NO hace match en PermissionMatcher y es rechazado en Capa 7 antes de llegar al Controller:
     curl -i http://localhost:8181/api/roles/abc -H "Authorization: Bearer <TOKEN_ADMIN>"
     # HTTP/1.1 403 Forbidden
     ```
  2. **Con el test unitario automatizado (`PermissionMatcherTest.java`):**
     ```bash
     cd backend && sh mvnw -Dtest=PermissionMatcherTest test
     # Tests run: 4, Failures: 0, Errors: 0
     ```
- **Qué debe mostrar la captura:** Terminal mostrando `GET /api/roles/1` → `200 OK` y `GET /api/roles/abc` → `403 Forbidden` (junto con la ejecución de `PermissionMatcherTest` en verde).

---

### EXTRA 2 · Protección contra autobloqueo del administrador (`assertManagementAccessRemains`)
- **Estado:** ✅ cumple
- **Implementación técnica:**
  - **Backend:** `backend/src/main/java/com/fac/backend/authorization/SecurityPermissions.java:7-14` define las 6 llaves críticas de administración de roles y permisos (`GET /api/roles`, `GET /api/permissions`, `GET /api/permissions/catalog`, `GET /api/roles/{id}/permissions`, `GET /api/roles/{id}/summary`, `PUT /api/roles/{id}/permissions`), y `backend/src/main/java/com/fac/backend/service/RolePermissionService.java:200, 281-335` (`assertManagementAccessRemains`) verifica mediante `UserRoleRepository.findUserIdsWithAllPermissionsExcludingRole(...)` si al quitar alguno de esos permisos del rol actual quedaría **algún otro usuario habilitado con rol activo** conservando acceso completo a la gestión de roles y permisos. Si no queda ninguno, lanza `ApplicationException(ErrorCase.INVALID_OPERATION)` con el mensaje exacto:
    ```java
    // RolePermissionService.java:330-334
    throw new ApplicationException(
            ErrorCase.INVALID_OPERATION,
            "No se puede retirar ese permiso: el sistema quedaría sin "
                    + "ningún usuario con acceso a la gestión de roles y permisos"
    );
    ```
- **Prueba paso a paso (para captura de pantalla):**
  1. Inicia sesión como `admin@uc.edu.co` y ve a **Seguridad > Asignar permisos** (`/roles/permisos`).
  2. Asegúrate de que el rol **`ADMIN`** esté seleccionado en **Rol seleccionado**.
  3. En el módulo **`Administración`**, fila **`Roles`**, desmarca la casilla **`Listar`** (o **`Actualizar`**) y pulsa el botón **`Guardar cambios`**.
  4. Debajo de los botones superiores aparecerá el banner rojo con el mensaje exacto: **`No se puede retirar ese permiso: el sistema quedaría sin ningún usuario con acceso a la gestión de roles y permisos`**.
- **Prueba alterna (si no se ve en la UI):**
  ```bash
  curl -i -X PUT http://localhost:8181/api/roles/1/permissions \
    -H "Authorization: Bearer <TOKEN_ADMIN>" -H "Content-Type: application/json" \
    -d '{"permissionIds":[]}'
  # HTTP/1.1 400 Bad Request -> {"status":400,"errorCase":"INVALID_OPERATION","message":"No se puede retirar ese permiso: el sistema quedaría sin ningún usuario con acceso a la gestión de roles y permisos"}
  ```
- **Qué debe mostrar la captura:** La vista `/roles/permisos` con el rol `ADMIN` seleccionado y el banner rojo mostrando `No se puede retirar ese permiso: el sistema quedaría sin ningún usuario con acceso a la gestión de roles y permisos`.

---

### EXTRA 3 · OAuth (Discord), rol por defecto `AFICIONADO`, segundo login sin duplicar, sin contraseña ni 2FA, y validez frente al Anexo 1
- **Estado:** ✅ cumple
- **Confirmación documental sobre Discord vs Microsoft en el Anexo 1:**
  - En `context-project/Anexo_1_Módulo Seguridad (1).md` (líneas 210-217, **HU-SE-08 -- Iniciar sesión con proveedor externo OAuth**), el criterio oficial dice textualmente:
    > *"El sistema debe permitir iniciar sesión mediante ** al menos tres proveedores externos** de autenticación, tales como **Google, GitHub y otro proveedor** configurado en el proyecto."*
  - El documento de reparto (`Reparto de responsabilidades – Anexo 1 Módulo de Seguridad.md`) mencionaba Microsoft solo como ejemplo entre paréntesis (`Google, GitHub y otro como Microsoft`), pero el **Anexo 1 oficial exige expresamente "Google, GitHub y otro proveedor configurado en el proyecto"**. Por tanto, implementar **Discord OAuth 2.0** como tercer proveedor junto a Google y GitHub **cumple al 100 % el Anexo 1** y además aplica el **Patrón Strategy + Principio de Inversión de Dependencias** (`OAuthCodeProviderStrategy` -> `DiscordOAuthClient`), como pidió el profesor en clase.
- **Implementación técnica:**
  1. **Rol por defecto (`AFICIONADO`):** Definido en `backend/src/main/java/com/fac/backend/service/UserService.java:33` (`private static final String DEFAULT_OAUTH_ROLE = "AFICIONADO";`) y asignado automáticamente al crear el usuario en `UserService.java:89, 125-135` (`assignDefaultRole(savedUser)`).
  2. **Segundo login no duplica:** En `UserService.java:55-65`, `userRepository.findByAuthProviderAndExternalId(proveedor, uid)` encuentra al usuario existente en el segundo login y lo retorna directamente sin crear otro registro; además la tabla `users` tiene `@UniqueConstraint(name = "uk_users_auth_provider_external_id", columnNames = {"auth_provider", "external_id"})` (`User.java:14-17`).
  3. **No pide contraseña ni 2FA interno:** En `UserService.java:82` el usuario OAuth se crea con `user.setPassword(null);` y `twoFactorEnabled = false`. En `User.java:103-112`, `requiresTwoFactor()` verifica `twoFactorEnabled && hasLocalCredentials()`, y en `AuthService.java:125-140` (`loginWithDiscord`) se emite la sesión JWT directamente (`issueSession(user)`) sin pasar por el reto 2FA de correo.
- **Prueba paso a paso (para captura de pantalla):**
  1. En `/auth/login` (o `/auth/register`), pulsa el botón **`Continuar con Discord`** y autoriza la aplicación en Discord.
  2. Al volver a `/auth/discord/callback`, entras directamente al inicio (`/`) sin que pida contraseña local ni código 2FA. En la esquina superior derecha (navbar) se ve tu nombre, tu foto de Discord y el rol **`AFICIONADO`**.
  3. Cierra sesión y vuelve a pulsar **`Continuar con Discord`**: entra nuevamente sin duplicar el usuario.
- **Prueba alterna (si no se ve en la UI):**
  ```sql
  SELECT u.id, u.name, u.email, u.auth_provider, u.external_id, u.password, u.two_factor_enabled, r.name AS rol
  FROM users u
  JOIN user_roles ur ON ur.user_id = u.id
  JOIN roles r ON r.id = ur.role_id
  WHERE u.auth_provider = 'DISCORD';
  -- 1 sola fila: auth_provider='DISCORD', password=NULL, two_factor_enabled=0, rol='AFICIONADO'
  ```
- **Qué debe mostrar la captura:** La barra superior o `/perfil` del usuario autenticado con Discord mostrando su rol `AFICIONADO`, y la consulta SQL en MySQL evidenciando 1 solo registro con `auth_provider = 'DISCORD'` y `password = NULL`.

---

### EXTRA 4 · Visibilidad en Frontend: menús y botones ocultos según permisos
- **Estado:** ✅ cumple
- **Implementación técnica:**
  1. **Menú lateral (`AppMenu.tsx` + `lib/navigation.ts`):**
     - En `frontend/layout/AppMenu.tsx:18-33`, cada ítem de la sección `Seguridad` (`Usuarios`, `Roles`, `Asignar permisos`, `Permisos`) evalúa `canAccessModule(module, hasPermissionUrl)`. Si ningún ítem de `Seguridad` es visible (`visible: securityItems.some((item) => item.visible)`), **toda la sección `Seguridad` desaparece del menú lateral**, quedando solo `Inicio` y `Mi cuenta > Mi perfil`.
  2. **Tarjetas de acceso rápido en Inicio (`QuickAccessGrid.tsx`):**
     - En `frontend/app/(main)/page.tsx`, `getAllowedModules(hasPermissionUrl)` filtra los módulos a los que el usuario tiene permiso.
  3. **Botones de acción dentro de cada vista CRUD:**
     - En `frontend/app/(main)/roles/page.tsx:106-109, 328-372, 391-405`: `canCreate` (`POST /api/roles`), `canUpdate` (`PUT /api/roles/{id}`), `canDelete` (`DELETE /api/roles/{id}`) y `canManagePermissions` ocultan los botones **`+ Nuevo rol`**, **`Editar`**, **`Eliminar`** y **`Matriz de permisos`** si el usuario solo tiene permiso de lectura (`GET /api/roles`).
     - En `frontend/app/(main)/permisos/page.tsx:168-171, 441-460, 482-496`: `canCreate`, `canUpdate`, `canDelete` y `canManageMatrix` ocultan **`+ Nuevo permiso`**, **`Editar`**, **`Eliminar`** y **`Asignar en matriz`**.
     - En `frontend/app/(main)/roles/[id]/usuarios/page.tsx:77-84, 480-485, 595-599`: `canAssign` (`POST /api/user-roles`) y `canRemove` (`DELETE /api/user-roles/{id}/{id}`) deshabilitan los botones **`+ Asociar`** y **`Retirar asociación`** si el rol del usuario no posee esos permisos.
- **Prueba paso a paso (para captura de pantalla):**
  1. **Con usuario sin permisos administrativos (`AFICIONADO`):** Inicia sesión con el usuario de Discord (o un usuario local con solo rol `AFICIONADO`). En la pantalla de inicio (`/`), observa que en el menú lateral izquierdo **NO existe la sección `Seguridad`** (solo aparecen `Inicio` y `Mi cuenta > Mi perfil`).
  2. **Con usuario de solo lectura (`CONSULTOR`):** Inicia sesión con un usuario que tenga el rol `CONSULTOR` (al que le diste únicamente `GET /api/roles`). En el menú lateral solo verá `Roles` (no verá `Permisos` ni `Asignar permisos`), y al entrar a `/roles` verá la tabla pero **NO verá los botones `+ Nuevo rol`, `✏️ Editar` ni `🗑️ Eliminar`**.
- **Prueba alterna (si no se ve en la UI):** Tests unitarios de frontend en `frontend/lib/access.test.ts`, `frontend/lib/navigation.test.ts` y `frontend/layout/ProtectedRoute.test.tsx`.
- **Qué debe mostrar la captura:** Comparativa del menú lateral y de `/roles` entre el `Administrador` (todos los menús y botones visibles) y el usuario `AFICIONADO` / `CONSULTOR` (menús y botones de escritura ocultos).

---

### EXTRA 5 · Contraseña del admin en configuración (`@Value`) y secretos OAuth fuera del repositorio
- **Estado:** ✅ cumple
- **Implementación técnica:**
  1. **Contraseña del admin parametrizada con `@Value`:**
     - En `backend/src/main/java/com/fac/backend/config/DatabaseSeeder.java:140-141, 288`:
       ```java
       @Value("${app.seed.admin-password:Admin123!}")
       private String adminPassword;
       ...
       user.setPassword(passwordEncoder.encode(adminPassword));
       ```
  2. **Secretos OAuth inyectados por `@Value` y excluidos de Git:**
     - En `backend/src/main/java/com/fac/backend/security/DiscordOAuthClient.java:33-36`:
       ```java
       @Value("${discord.client-id:}") String clientId,
       @Value("${discord.client-secret:}") String clientSecret,
       @Value("${discord.allowed-redirect-uris:http://localhost:3000/auth/discord/callback}") String allowedRedirectUris
       ```
     - En `backend/.gitignore` están ignorados `src/main/resources/application.properties` y `.env`, y en `frontend/.gitignore` están ignorados `.env` y `.env.local` (verificado con `git ls-files`: solo existen las plantillas `.env.example` y `.env.local.example` sin secretos en el repositorio).
- **Prueba paso a paso / alterna (para captura de pantalla):**
  ```bash
  # Verificar que ni application.properties ni .env están rastreados en Git:
  git ls-files backend/src/main/resources/application.properties backend/.env frontend/.env.local
  # (Salida vacía: ningún archivo de secretos está en el repositorio)
  ```
- **Qué debe mostrar la captura:** Las líneas 140-141 de `DatabaseSeeder.java` con `@Value("${app.seed.admin-password:Admin123!}")` y la salida vacía de `git ls-files` demostrando que los secretos locales no se suben a Git.

---

### EXTRA 6 · Pruebas automatizadas (`PermissionMatcher`, `EffectivePermissionService`, `DynamicAuthorizationManager`, `RolePermissionService.syncPermissions`)
- **Estado:** ✅ cumple (`120/120` pruebas del backend pasando, `0` fallos)
- **Implementación técnica:**
  1. **`backend/src/test/java/com/fac/backend/authorization/PermissionMatcherTest.java`** (`4` tests):
     - `matchesNumericSegmentAgainstQuestionMarkAndIdPlaceholder`: prueba que `/api/roles/15` hace match con `/api/roles/?` y con `/api/roles/{id}`.
     - `rejectsNonNumericSegmentAgainstParameterizedRoute`: prueba que `/api/roles/abc` NO hace match con `/api/roles/?` ni con `/api/roles/{id}`.
     - `normalizesMultipleDynamicIdsAndHexObjectIds`: prueba rutas con dos IDs (`/api/user-roles/10/25`) y ObjectIds hexadecimales de 24 caracteres.
     - `handlesNullInputsSafely`: prueba seguridad ante `null`.
  2. **`backend/src/test/java/com/fac/backend/service/EffectivePermissionServiceTest.java`** (`2` tests):
     - `findByUserIdReturnsDistinctPermissionsFromRepository`: verifica delegación con Mockito a `permissionRepository.findAllByUserId(userId)`.
     - `declaresCacheableAnnotationForEffectivePermissionsCache`: verifica por reflexión `@Cacheable(cacheNames = "effectivePermissions", key = "#userId")`.
  3. **`backend/src/test/java/com/fac/backend/authorization/DynamicAuthorizationManagerTest.java`** (`7` tests):
     - Prueba concesión (`200`), denegación (`403`), usuario no autenticado, subject no numérico, rutas públicas de usuario autenticado (`/api/auth/me`, `/api/auth/logout`, `/api/profile/me`) y lectura desde el atributo precargado por `EffectivePermissionsFilter`.
  4. **`backend/src/test/java/com/fac/backend/service/RolePermissionServiceTest.java`** (`7` tests):
     - Prueba `syncPermissions` agregando y quitando permisos en lote, rechazo de IDs duplicados, rechazo de IDs inexistentes, bloqueo anti-autobloqueo cuando ningún otro usuario conserva acceso, permiso cuando otro usuario sí conserva acceso y cálculo de `findRoleSummary`.
- **Prueba paso a paso (para captura de pantalla):**
  Ejecuta en la terminal dentro de `backend/`:
  ```bash
  cd backend && sh mvnw -Dtest=PermissionMatcherTest,EffectivePermissionServiceTest,DynamicAuthorizationManagerTest,RolePermissionServiceTest test
  ```
  Resultado obtenido:
  ```text
  [INFO] Running com.fac.backend.authorization.DynamicAuthorizationManagerTest
  [INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.fac.backend.authorization.PermissionMatcherTest
  [INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.fac.backend.service.EffectivePermissionServiceTest
  [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Running com.fac.backend.service.RolePermissionServiceTest
  [INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
  [INFO] Results:
  [INFO] Tests run: 20, Failures: 0, Errors: 0, Skipped: 0
  [INFO] BUILD SUCCESS
  ```
- **Qué debe mostrar la captura:** La consola mostrando `Tests run: 20, Failures: 0, Errors: 0, Skipped: 0` y `BUILD SUCCESS` (o la corrida completa con `120` tests en verde).

---

## 7. Entregables Finales de Auditoría

### (a) Tabla Resumen de Cumplimiento

| ID / Sección | Criterio | Estado | Evidencia principal (Archivo : Línea) |
| :--- | :--- | :---: | :--- |
| **HU-SE-03 · C1** | Registrar rol con nombre y descripción | ✅ | `RoleService.java:31-41`, `roles/page.tsx:189-231` |
| **HU-SE-03 · C2** | No permitir roles duplicados con el mismo nombre | ✅ | `RoleService.java:32-37, 65-70`, `Role.java:38-44` |
| **HU-SE-03 · C3** | Consultar listado de roles | ✅ | `RoleController.java:42-45`, `roles/page.tsx:471-508` |
| **HU-SE-03 · C4** | Consultar información detallada de cada rol | ✅ | `RolePermissionService.java:116-140`, `roles/page.tsx:512-704` |
| **HU-SE-03 · C5** | Actualizar información de un rol | ✅ | `RoleService.java:58-74`, `roles/page.tsx:177-222` |
| **HU-SE-03 · C6** | Eliminar rol cuando no existan restricciones | ✅ | `RoleService.java:76-94`, `roles/page.tsx:233-277` |
| **HU-SE-03 · C7** | Validar antes de eliminar si está asignado a usuarios | ✅ | `RoleService.java:83-88`, `roles/page.tsx:706-733` |
| **HU-SE-03 · C8** | Desde el rol acceder a sus usuarios y permisos | ✅ | `roles/page.tsx:339-360, 657-683` |
| **HU-SE-03 · C9** | Eliminar rol no elimina usuarios ni permisos | ✅ | `Role.java:61-67`, `RoleServiceDeleteIntegrationTest.java:36-56` |
| **HU-SE-04 · C1** | Usuario y rol previamente registrados | ✅ | `UserRoleService.java:39-42` |
| **HU-SE-04 · C2** | Seleccionar rol y ver sus usuarios | ✅ | `UserRoleController.java:36-40`, `roles/[id]/usuarios/page.tsx:318-361` |
| **HU-SE-04 · C3** | Desde el rol agregar usuarios | ✅ | `UserRoleService.java:38-52`, `roles/[id]/usuarios/page.tsx:170-199` |
| **HU-SE-04 · C4** | Mostrar usuarios disponibles | ✅ | `UserRepository.java:39-50`, `roles/[id]/usuarios/page.tsx:388-528` |
| **HU-SE-04 · C5** | Un usuario puede tener varios roles | ✅ | `UserRole.java:8-32`, `UserRoleService.java:60-62` |
| **HU-SE-04 · C6** | Un rol puede tener varios usuarios | ✅ | `UserRoleRepository.java:22-23`, `roles/[id]/usuarios/page.tsx:542-611` |
| **HU-SE-04 · C7** | No asignar dos veces el mismo rol al mismo usuario | ✅ | `UserRole.java:11-14`, `UserRoleService.java:44-46`, `page.tsx:480-507` |
| **HU-SE-04 · C8** | Retirar usuario de un rol | ✅ | `UserRoleService.java:77-83`, `roles/[id]/usuarios/page.tsx:222-249` |
| **HU-SE-04 · C9** | Retirar no elimina usuario ni rol | ✅ | `UserRole.java:25-31`, `UserRoleService.java:81-83` |
| **HU-SE-04 · C10** | Cambios se reflejan en permisos efectivos (`@CacheEvict`) | ✅ | `UserRoleService.java:34-37, 77-80`, `EffectivePermissionService.java:17-21` |
| **HU-SE-04 · C11** | Pedir confirmación al retirar | ✅ | `roles/[id]/usuarios/page.tsx:201-251` |
| **HU-SE-05 · C1** | Registrar permiso | ✅ | `PermissionService.java:34-47`, `permisos/page.tsx:295-339` |
| **HU-SE-05 · C2** | Identificar recurso y módulo | ✅ | `Permission.java:61-65`, `PermissionCatalogService.java:131-175` |
| **HU-SE-05 · C3** | Indicar operación que autoriza | ✅ | `PermissionOperation.java:3-19`, `PermissionCatalogService.java:111-129` |
| **HU-SE-05 · C4** | Asociar URL, método HTTP y modelo/recurso | ✅ | `Permission.java:45-66`, `permisos/page.tsx:838-1001` |
| **HU-SE-05 · C5** | Consultar listado de permisos | ✅ | `PermissionController.java:35-43`, `permisos/page.tsx:567-611` |
| **HU-SE-05 · C6** | Consultar detalle de un permiso y sus roles | ✅ | `PermissionController.java:45-48`, `permisos/page.tsx:616-781` |
| **HU-SE-05 · C7** | Actualizar permiso | ✅ | `PermissionService.java:67-81`, `permisos/page.tsx:264-277` |
| **HU-SE-05 · C8** | Eliminar permiso cuando no esté asignado a roles | ✅ | `PermissionService.java:83-94`, `permisos/page.tsx:341-389` |
| **HU-SE-05 · C9** | Evitar duplicados para misma operación y recurso | ✅ | `Permission.java:25-28`, `PermissionService.java:39-44, 116-128` |
| **HU-SE-05 · C10** | Eliminar permiso no elimina roles asociados | ✅ | `Permission.java:67-69`, `PermissionService.java:87-94` |
| **HU-SE-06 · C1** | Rol y permisos previamente registrados | ✅ | `RolePermissionService.java:153-189` |
| **HU-SE-06 · C2** | Seleccionar rol desde la interfaz | ✅ | `RoleSelector.tsx:22-112`, `roles/permisos/page.tsx:246-270` |
| **HU-SE-06 · C3** | Mostrar permisos asignados al seleccionar rol | ✅ | `useRolePermissions.ts:59-85`, `RoleController.java:57-65` |
| **HU-SE-06 · C4** | Permisos agrupados por módulo y recurso | ✅ | `PermissionCatalogService.java:56-72`, `PermissionMatrix.tsx:190-272` |
| **HU-SE-06 · C5** | Matriz similar al mockup `1_HU-SE-06 .png` | ✅ | `PermissionMatrix.tsx:163-447`, `RoleSummaryPanel.tsx:30-195` |
| **HU-SE-06 · C6** | Operaciones Ver, Listar, Crear, Actualizar, Eliminar | ✅ | `PermissionCatalogService.java:111-129`, `PermissionMatrix.tsx:17-26` |
| **HU-SE-06 · C7** | Asignar marcando casillas | ✅ | `PermissionMatrix.tsx:244-251, 386-400`, `useRolePermissions.ts:132-150` |
| **HU-SE-06 · C8** | Retirar desmarcando casillas | ✅ | `useRolePermissions.ts:141`, `RolePermissionService.java:202-205` |
| **HU-SE-06 · C9** | Un rol varios permisos | ✅ | `Role.java:65-67`, `DatabaseSeeder.java:32-118` |
| **HU-SE-06 · C10** | Un permiso varios roles | ✅ | `Permission.java:67-69`, `RolePermissionController.java:44-48` |
| **HU-SE-06 · C11** | No duplicar asociación rol-permiso | ✅ | `RolePermission.java:19-22`, `RolePermissionService.java:61-65, 167-172` |
| **HU-SE-06 · C12** | Matriz marca solo lo realmente asignado | ✅ | `PermissionMatrix.tsx:323-381` |
| **HU-SE-06 · C13** | Guardar atómico con `@Transactional` | ✅ | `RolePermissionService.java:138-240`, `roles/permisos/page.tsx:183-195` |
| **HU-SE-06 · C14** | Retirar permiso del rol no lo elimina del sistema | ✅ | `RolePermissionService.java:217-219`, `RoleSummaryPanel.tsx:194-198` |
| **HU-SE-06 · C15** | Cambios aplican a todos los usuarios con ese rol | ✅ | `RolePermissionService.java:138-141` (`@CacheEvict(allEntries = true)`) |
| **HU-SE-06 · C16** | Si ningún rol tiene el permiso → `403 Forbidden` | ✅ | `DynamicAuthorizationManager.java:64-76`, `ProtectedRoute.tsx:81-83` |
| **HU-SE-06 · C17** | Si al menos un rol lo tiene → `200 OK` | ✅ | `PermissionRepository.java:38-48`, `DynamicAuthorizationManager.java:68-73` |
| **HU-SE-06 · C18** | Permisos se mantienen tras cerrar e iniciar sesión | ✅ | `RolePermissionService.java:221`, `AuthService.java:160-180` |
| **EXTRA 1** | Autorización dinámica (`/api/roles/15` vs `/api/roles/abc`) | ✅ | `DynamicAuthorizationManager.java`, `PermissionMatcher.java:15-46` |
| **EXTRA 2** | Autobloqueo del admin (`assertManagementAccessRemains`) | ✅ | `RolePermissionService.java:281-335`, `SecurityPermissions.java:7-14` |
| **EXTRA 3** | OAuth Discord: rol `AFICIONADO`, sin duplicar, sin 2FA | ✅ | `UserService.java:33, 55-92`, `DiscordOAuthClient.java`, `Anexo 1` |
| **EXTRA 4** | Menús y botones ocultos según permisos en Frontend | ✅ | `AppMenu.tsx:18-33`, `navigation.ts:64-70`, `roles/page.tsx:106-109` |
| **EXTRA 5** | Contraseña admin en `@Value` y secretos fuera de Git | ✅ | `DatabaseSeeder.java:140-141`, `backend/.gitignore`, `frontend/.gitignore` |
| **EXTRA 6** | Pruebas automatizadas JUnit 5 / Mockito (`20/20` y `120/120`) | ✅ | `PermissionMatcherTest`, `EffectivePermissionServiceTest`, `DynamicAuthorizationManagerTest`, `RolePermissionServiceTest` |

---

### (b) Usuarios y Roles de Prueba Recomendados para la Sustentación y Demos

El `DatabaseSeeder.java` ya crea automáticamente al arrancar el backend los **6 roles base** (`ADMIN`, `COORDINADOR`, `OPERADOR`, `CONSULTOR`, `JUEZ DEPORTIVO`, `AFICIONADO`) y el usuario **Administrador** (`admin@uc.edu.co` / `Admin123!`). Para repetir todas tus pruebas en menos de 3 minutos, ten listos únicamente estos **3 usuarios adicionales**:

1. **`admin@uc.edu.co`** (Contraseña: `Admin123!`) — **Rol:** `ADMIN` (creado automáticamente por `DatabaseSeeder`).
   - *Para qué sirve:* Crear/editar/eliminar roles y permisos, usar la matriz RBAC y probar el bloqueo de **autobloqueo del admin** al intentar quitarse permisos de gestión de roles.
2. **`carlos@uc.edu.co`** (Nombre: `Carlos Pérez`, Contraseña: `Password123!`) — **Roles:** `AFICIONADO` + `CONSULTOR` (Usuario con **2 roles**).
   - *Para qué sirve:* Probar **HU-SE-04** (asociar un mismo usuario a varios roles), **HU-SE-06 C17** (aunque `AFICIONADO` no tiene permisos, `CONSULTOR` le da acceso `GET /api/users`) y **EXTRA 4** (ver que un usuario con permisos de solo lectura ve la tabla pero tiene ocultos los botones de crear/editar/eliminar).
3. **`laura@uc.edu.co`** (Nombre: `Laura Gómez`, Contraseña: `Password123!`) o **Tu cuenta de Discord OAuth** — **Rol:** únicamente `AFICIONADO` (`0` permisos administrativos).
   - *Para qué sirve:* Probar **EXTRA 3** (registro/login con Discord asignando `AFICIONADO` por defecto sin pedir 2FA), **EXTRA 4** (la sección `Seguridad` desaparece por completo del menú lateral) y **HU-SE-06 C16** (entrar a `/roles` muestra `Acceso restringido` y `GET /api/roles` devuelve `403 Forbidden`).

---

### (c) Orden Recomendado para Tomar las Capturas de Pantalla (Flujo sin deshacer datos)

Sigue este orden exacto para que cada paso prepare los datos del siguiente sin tener que reiniciar la base de datos:

1. **Captura 1–3 (`HU-SE-05` Catálogo y detalle de permisos):**
   - Entra como `admin@uc.edu.co` a **Seguridad > Permisos** (`/permisos`).
   - Toma captura de la tabla general (`58 permisos`), filtra por módulo `Gestión Deportiva` y selecciona `GET /api/torneos` para capturar el panel derecho **Detalle del permiso** con `● ADMIN` y `● COORDINADOR`.
2. **Captura 4–7 (`HU-SE-05` Crear, duplicado, actualizar, bloqueo de borrado y borrado exitoso):**
   - Pulsa **`+ Nuevo permiso`**, usa el **Asistente rápido** y crea `POST /api/inscripciones` (captura del modal y del toast `Permiso registrado`).
   - Abre **`+ Nuevo permiso`** otra vez con `POST /api/inscripciones` y pulsa **Guardar** (captura del error `Ya existe un permiso con esa url y método`).
   - Edita `POST /api/inscripciones` a `POST /api/inscripciones/registro` (captura de `Permiso actualizado`).
   - Intenta borrar `GET /api/torneos` (captura del bloqueo rojo `No se puede eliminar un permiso que está asignado`) y luego borra `POST /api/inscripciones/registro` (captura de `Permiso eliminado`).
3. **Captura 8–12 (`HU-SE-03` Listado, detalle, crear, duplicado, editar y borrar rol):**
   - Ve a **Seguridad > Roles** (`/roles`), selecciona `COORDINADOR` (captura de la tabla y del panel derecho **Detalle del rol** con los botones `Usuarios del rol` y `Permisos`).
   - Pulsa **`+ Nuevo rol`** y crea `AUDITOR DEPORTIVO` (captura de `Rol creado`).
   - Intenta crear otro rol llamado `auditor deportivo` (captura del error `Ya existe un rol con ese nombre`).
   - Edita la descripción de `AUDITOR DEPORTIVO` (captura de `Rol actualizado`).
   - Intenta eliminar el rol `ADMIN` (captura del bloqueo rojo `No se puede eliminar un rol que está asignado`) y luego elimina `AUDITOR DEPORTIVO` que tiene 0 usuarios (captura del diálogo de confirmación y del toast `Rol eliminado`, verificando que siguen los 58 permisos).
4. **Captura 13–17 (`HU-SE-04` Usuarios disponibles, asociar, multi-rol, no duplicar y retirar con confirmación):**
   - Desde `/roles`, pulsa **`Usuarios del rol`** en `COORDINADOR` (`/roles/2/usuarios`).
   - Captura los paneles **Usuarios disponibles** (izquierda) y **Usuarios asociados** (derecha).
   - Pulsa **`+ Asociar`** en `Carlos Pérez` y en `Laura Gómez` (captura del banner verde `asociado correctamente`, de los 2 usuarios en el panel derecho y de la alerta amarilla `Este usuario ya se encuentra asociado al rol.` en el panel izquierdo).
   - Cambia el selector superior a `CONSULTOR` y asocia también a `Carlos Pérez` (captura en `/usuarios/2/roles` mostrando sus 2 roles y sus permisos efectivos).
   - Vuelve a `COORDINADOR`, pulsa **`Retirar asociación`** en `Laura Gómez` (captura del modal de confirmación **`Retirar asociación de rol`** y luego del banner `Se retiró la asociación de Laura Gómez.`).
5. **Captura 18–22 (`HU-SE-06` Matriz RBAC, autobloqueo del admin y persistencia):**
   - Ve a **Seguridad > Asignar permisos** (`/roles/permisos`).
   - Selecciona `CONSULTOR` (captura de la matriz marcando solo los 2 permisos asignados) y luego `OPERADOR` (marca permisos de `Entradas`, captura del badge `Sin guardar` y luego pulsa **`Guardar cambios`** para capturar el banner `Permisos actualizados correctamente.`).
   - Selecciona `ADMIN`, desmarca `Listar` en `Roles` y pulsa **`Guardar cambios`** (captura del bloqueo anti-autobloqueo: `No se puede retirar ese permiso: el sistema quedaría sin ningún usuario con acceso a la gestión de roles y permisos`).
   - Cierra sesión, vuelve a entrar como `admin@uc.edu.co` y abre `/roles/permisos` en `OPERADOR` para capturar que los permisos de `Entradas` persisten tras relogin.
6. **Captura 23–25 (`EXTRAS` OAuth Discord, usuario sin permisos `403`, matcher `/api/roles/15` vs `/api/roles/abc` y tests JUnit):**
   - Inicia sesión con **Discord** (captura de usuario con rol `AFICIONADO`, menú lateral sin sección `Seguridad`, y vista `/roles` mostrando `Acceso restringido`).
   - Captura en terminal/Postman de `GET /api/roles/1` (`200 OK`) vs `GET /api/roles/abc` (`403 Forbidden`) y de `mvnw test` mostrando `BUILD SUCCESS`.
