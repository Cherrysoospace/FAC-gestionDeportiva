## Reparto de responsabilidades – Anexo 1: Módulo de Seguridad

Proyecto del Curso Desarrollo Backend · Equipo de 3 personas: Alejandra (A), Cristhian (B) y Fercho (C) · Plazo: 6 días · Frontend en React · Backend en Spring Boot con JPA

## 1. Alcance

El Anexo 1 define 10 historias de usuario (HU-SE-01 a HU-SE-10): gestión de usuarios, perfiles, roles y permisos; asignación de roles a usuarios y de permisos a roles; registro por credenciales; autenticación y sesión (credenciales y OAuth con Google, GitHub y Microsoft); recuperación de contraseña; y autenticación de dos factores.

Se asume que el modelo de datos y los mockups mencionados en el anexo ya están disponibles para el equipo. El backend parte del proyecto base hecho en clase, que el profesor autorizó usar; las estimaciones ya descuentan lo que ese proyecto trae, según el

diagnóstico RESULTADO_DIAGNOSTICO.md .

- Ya trae el proyecto base: CRUD de usuarios, perfiles, roles, permisos y sus asociaciones; contraseñas con BCrypt; JWT sin estado; autorización dinámica por URL y método HTTP; manejo global de errores; una entidad de sesión que hoy no se usa.

- Falta o hay que cambiar: campos del usuario (habilitado, mecanismo de registro, 2FA), foto en el perfil, recurso o módulo en el permiso, registro público, sesión persistida con logout, 2FA, OAuth, recuperación de contraseña con correo, matriz de permisos con guardado completo, usuarios disponibles para un rol, CORS y perfiles dev / prod .

- Riesgos del base: el JWT sin estado choca con la sesión persistida que pide el anexo; CascadeType.ALL y el borrado físico del usuario; no hay pruebas más allá del arranque del contexto.

## 2. Criterios del reparto

- Cada persona lleva una parte de backend y una de frontend, de modo que nadie dependa de otro para ver su trabajo funcionando.

- OAuth queda repartido entre las tres personas: Alejandra lleva el flujo con Google y GitHub y los botones de acceso; Cristhian la lógica de usuarios (crear o identificar, rechazos y duplicados); Fercho el proveedor Microsoft y el rol por defecto de los usuarios creados por OAuth. Ninguna persona lo lleva completo.

- Frontend queda repartido entre las tres personas: Alejandra en autenticación, Cristhian en cuentas y usuarios, Fercho en roles y permisos.


- La autenticación (quién eres) queda con Alejandra y la autorización (qué puedes hacer) con Fercho. Fercho expone el servicio que decide si un usuario tiene un permiso y Alejandra lo invoca desde el filtro de seguridad, así no se pisan en la configuración.

- La carga se midió en puntos de esfuerzo relativos (1 punto equivale aproximadamente a medio día de trabajo; es una estimación, no una medición). Total: 47 puntos (ya descuenta lo que trae el proyecto base).

## 3. Asignación por persona

| Alejandra (Persona A): | Cristhian (Persona B): | Fercho (Persona C): |
| --- | --- | --- |
| Autenticación y sesión | Cuentas y usuarios | Roles y permisos |
|   |   | (RBAC) |
| Backend CORS, perfiles | Servicio de correo | Cambios al modelo el |
| dev / prod y | (envío real o simulado | día 1: campos del |
| dependencia oauth2- | en consola). HU-07: | usuario (habilitado, |
| client (el manejo | endpoint público de | mecanismo de registro, |
| global de errores ya | registro, separado del | 2FA), recurso o módulo |
| existe). HU-08: persistir | CRUD administrativo, | en el permiso, semilla |
| la sesión (token con | con mecanismo de | de la matriz y |
| expiración) al emitir el | registro. HU-01: | contraseña del |
| JWT, validarla en cada | desactivación con | administrador fuera del |
| petición, logout que la | campo habilitado y | código. HU-03, HU-04 |
| invalida, validar usuario | revisión de las cascadas | (endpoint de usuarios |
| habilitado y endpoint | de borrado. HU-02: foto | disponibles) y HU-05 |
| /auth/me . HU-10: 2FA | en el perfil y acceso | (recurso o módulo): |
| completo (desde cero). | solo del propietario o | ajustes sobre lo |
| Conectar la sesión con | administrador. HU-09: | existente. HU-06: |
| el filtro de autorización | recuperación (token de | endpoint de la matriz |
| existente. OAuth: flujo | un solo uso con | agrupada por recurso y |
| con Google y GitHub | vigencia, invalidar | guardado completo en |
| que termina en la | sesiones anteriores). | una transacción. |
| misma sesión interna. | OAuth: crear o | Pruebas del servicio de |
|   | identificar usuario, | autorización existente. |
|   | rechazar si el correo ya | OAuth: proveedor |
|   | existe como cuenta de | Microsoft y rol por |
|   | credenciales, evitar | defecto para los |
|   | duplicados. | usuarios creados por |
|   |   | OAuth. |


| Alejandra (Persona A): | Cristhian (Persona B): | Fercho (Persona C): |
| --- | --- | --- |
| Autenticación y sesión | Cuentas y usuarios | Roles y permisos |
|   |   | (RBAC) |
| Frontend Contexto de | Esqueleto React y | Roles (lista, detalle, |
| autenticación, | componentes base. | formulario). Usuarios |
| interceptores y rutas | Registro. Usuarios (lista, | del rol (agregar y retirar |
| protegidas. Login. | detalle, formulario). | con confirmación). |
| Pantalla de 2FA | Perfil con foto. | Permisos (CRUD). |
| (verificación y | Recuperar y restablecer | Matriz de permisos. |
| configuración). OAuth: | contraseña. | Ocultar menús y |
| botones de proveedor, |   | acciones según |
| callback y mensajes de |   | permisos. |
| error. |   |   |
| Carga ~34 % (15,75 puntos) | ~32 % (15,25 puntos) | ~34 % (16 puntos) |
| relativa |   |   |

## Cobertura por historia de usuario

| HU | Backend | Frontend |
| --- | --- | --- |
| HU-SE-01 Gestionar usuarios Cristhian (falta habilitado y revisar |   | Cristhian |
|   | cascadas) |   |
| HU-SE-02 Gestionar perfiles Cristhian (falta foto y acceso por |   | Cristhian |
|   | propietario) |   |
| HU-SE-03 Gestionar roles | Fercho (ya implementado; verificar) | Fercho |
| HU-SE-04 Asignar roles a | Fercho (falta usuarios disponibles) | Fercho (usuarios |
| usuarios |   | del rol) |
| HU-SE-05 Gestionar permisos Fercho (falta recurso o módulo) |   | Fercho |
| HU-SE-06 Asignar permisos a | Fercho (falta matriz y guardado | Fercho |
| roles | completo) |   |
| HU-SE-07 Registro por | Cristhian (falta endpoint público) | Cristhian |
| credenciales |   |   |
| HU-SE-08 Autenticación y | Alejandra (sesión y logout), Cristhian | Alejandra |
| sesión | (usuarios OAuth), Fercho (Microsoft |   |
|   | y rol por defecto) |   |
| HU-SE-09 Recuperar | Cristhian (desde cero) | Cristhian |
| contraseña |   |   |


| HU | Backend | Frontend |
| --- | --- | --- |
| HU-SE-10 Autenticación de | Alejandra (desde cero) | Alejandra |
| dos factores |   |   |

## 4. Cronograma de 6 días

| Día Alejandra (A) |   | Cristhian (B) | Fercho (C) |
| --- | --- | --- | --- |
| 1 | CORS, perfiles | Esqueleto React y | Cambios al modelo |
|   | dev / prod , dependencia | componentes base | (campos del usuario, foto, |
|   | oauth2-client . Decidir |   | recurso o módulo del |
|   | con el equipo cómo se |   | permiso) y semilla. Debe |
|   | persiste la sesión |   | quedar integrado al final |
|   |   |   | del día |
| 2 | HU-08: sesión persistida, | Servicio de correo. HU-07 | HU-03, HU-04 (usuarios |
|   | validación en cada | registro. HU-01: habilitado | disponibles) y HU-05 |
|   | petición, logout y | y cascadas (backend) | (recurso o módulo): |
|   | /auth/me . Contexto de |   | ajustes. Frontend de roles |
|   | autenticación e |   |   |
|   | interceptores (frontend) |   |   |
| 3 | Frontend de login. HU-10: | HU-02: foto y acceso por | HU-06: matriz y guardado |
|   | 2FA (backend) | propietario (backend). | completo (backend). |
|   |   | Frontend de usuarios y de | Pruebas de autorización. |
|   |   | registro | Frontend de permisos |
|   |   |   | (CRUD) |
| 4 | OAuth: flujo con Google y | HU-09 recuperación | Frontend de la matriz de |
|   | GitHub, botones y | (backend). OAuth: lógica | permisos y de usuarios |
|   | callback | de usuarios | del rol |
| 5 | Frontend de 2FA. | Frontend de recuperación | OAuth: proveedor |
|   | Conectar la sesión con el | y de perfil | Microsoft y rol por |
|   | filtro de autorización |   | defecto. Ocultar menús y |
|   |   |   | acciones según permisos |
| 6 | Integración, pruebas |   |   |
|   | cruzadas, correcciones, |   |   |
|   | README y demo (los |   |   |
|   | tres) |   |   |


En el día 6 se prueban entre ustedes: Alejandra prueba lo de Fercho, Cristhian lo de Alejandra y Fercho lo de Cristhian. Fercho además prueba OAuth de punta a punta con los tres proveedores.

## 5. Acuerdos para el día 1 (1 hora, los tres)

- 1. Contrato de API: endpoints, DTOs y formato de error. Es lo que permite trabajar en paralelo.

- 2. Sesión: token enviado como Bearer . Alejandra define cómo se persiste; recomendación: guardar el identificador del JWT en la tabla Session con su expiración y validarlo en cada petición, para que el logout lo invalide. Alejandra también expone /auth/me con el usuario y sus permisos efectivos.

- 3. Interfaz de OAuth entre Alejandra y Cristhian: algo como desde su handler y Cristhian la implementa; debe quedar cerrada el día 3. Fercho reutiliza el flujo para Microsoft. resolverUsuario(proveedor, idExterno, correo, nombre) . Alejandra la invoca

- 4. Cambios al modelo: como el esquema se genera con ddl-auto=update , los cambios del día 1 entran primero por Fercho y nadie más agrega o renombra columnas sin avisar. Las tablas nuevas son de quien las crea: Alejandra ajusta Session y el código 2FA; Cristhian el token de recuperación y la cuenta externa.

- 5. Git: una rama por HU y un pull request revisado por otra persona.

## 6. Decisiones pendientes y plan de recorte

- El anexo no indica el canal del 2FA. Sugerencia: código por correo, con el servicio de correo de Cristhian, vigencia corta y un límite de intentos por definir.

- Foto de perfil: confirmar con el profesor si es una URL o un archivo.

- Spring Boot 4.1.1 en el pom.xml : confirmar que el entorno de clase lo admite.

- La semilla trae la contraseña del administrador escrita en el código: moverla a configuración (Fercho).

- Rol por defecto de los usuarios creados por OAuth: definir cuál (Fercho).

- Si el equipo va atrasado, recortar en este orden: (1) el proveedor Microsoft (el anexo exige Google, GitHub y "otro proveedor"); (2) los detalles de la matriz de permisos; (3) el 2FA.
