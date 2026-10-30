# Prompt: Login con Google (Firebase) — backend + frontend

> Pega todo esto en Claude Code, en la raíz del proyecto (donde están `backend/` y `frontend/`).

---

## Rol y contexto

Eres un ingeniero full-stack trabajando en el proyecto "ms-security" (módulo de seguridad). Debes implementar **login con Google usando Firebase Authentication como intermediario**, de punta a punta (backend Spring Boot + frontend Next.js).

Firebase ya está configurado en la consola y el proveedor **Google ya está habilitado**. No hay despliegue: solo `localhost`.

Lee primero `DIAGNOSTICO_PROYECTO.txt` y `Contrato_API_Modulo_Seguridad_v5.xlsx` si están en el repo (si no, usa el resumen de abajo). **Verifica cada afirmación contra el código real antes de modificar** y, si algo difiere, repórtalo y adapta el cambio.

### Estado actual relevante (según diagnóstico)
- Backend: Spring Boot 4.1.1, Java 17, Maven (`mvnw`), paquete `com.fac.backend`. Jackson 3 (`tools.jackson.*`), no `com.fasterxml`.
- Ya existe `spring-boot-starter-oauth2-resource-server` (Nimbus 10.9.1 transitivo). **NO agregar** `oauth2-client`, Firebase Admin SDK ni otras librerías JWT.
- `SecurityConfig`: CSRF off, stateless, solo `POST /api/auth/login` es público; todo lo demás pasa por `DynamicAuthorizationManager` (permiso por método+URL en BD). **Ya hay CORS configurado.**
- `JwtConfig` define UN bean `JwtDecoder` HS256 (issuer `ms-security`) y un `JwtEncoder`. `JwtService.generateToken(user)` emite JWT de 15 min con `sub=userId`, `jti`, `email`. Respuesta `AuthResponseDTO{accessToken, tokenType, expiresAt}`.
- `AuthService.login` no escribe en `Session`. `User` NO tiene `enabled`, ni proveedor, ni uid externo; `password` es `nullable=false`.
- `DatabaseSeeder` crea solo ADMIN y CONSULTOR (no existe AFICIONADO).
- Errores: `GlobalExceptionHandler` devuelve `{errorCase, message}`; `ApplicationException` mapea NOT_FOUND→404, ALREADY_EXISTS→409, INVALID_OPERATION→400, UNAUTHORIZED→401 (no existe 403).
- Frontend: Next.js 13.4.8 App Router + TypeScript + PrimeReact 10.2.1. No hay axios, ni cliente HTTP, ni contexto de auth, ni guardas, ni variables de entorno. `app/(full-page)/auth/login/page.tsx` es solo visual.

### Contrato a implementar (fila #7 del xlsx)
`POST /api/auth/oauth/firebase` — público — entrada `{"idToken"}` — salida `{"token","expiresAt"}` (mismo formato y misma sesión que el login).
Errores: 401 token inválido/expirado/de otro proyecto · 403 usuario deshabilitado · 409 el correo ya existe (cuenta con contraseña u otro proveedor) · 400 el proveedor no entregó correo.

Reglas acordadas:
- El backend verifica el ID token de Firebase (firma RS256 con JWKS de Google, expiración, **audience = projectId**, **issuer = `https://securetoken.google.com/<projectId>`**) con una **instancia propia** de `NimbusJwtDecoder`, **NO como bean global `JwtDecoder`** (rompería la validación del JWT de la app y `oauth2ResourceServer`). Va como campo privado de un componente (p. ej. `FirebaseTokenVerifier`).
- JWKS: `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`.
- Identidad = `(proveedor, uid)`, **nunca por correo**. Proveedor = claim `firebase.sign_in_provider` (mapa anidado `firebase`; para Google es `google.com`). uid = claim `sub` (igual a `user_id`).
- No exigir `email_verified`. Nunca vincular cuentas por correo.
- Usuario nuevo → rol **AFICIONADO** (permisos mínimos, nada administrativo).
- Si falta el nombre → usar la parte del correo antes de la `@`.
- Después se emite el JWT propio y se crea la fila en `Session`, igual que el login.

---

## Plan de trabajo (hazlo por fases y no pases a la siguiente sin que la anterior compile)

### Fase 0 — Verificación
1. Lee `application.properties` (anota `server.port` real), `SecurityConfig`, `JwtConfig`, `JwtService`, `AuthService`, `AuthController`, `User`, `UserService`, `Session`, `SessionService`, `DatabaseSeeder`, `GlobalExceptionHandler`, `ApplicationException`.
2. Dime en 5 líneas qué encontraste distinto al diagnóstico (si algo).

### Fase 1 — Modelo de datos (backend)
1. `User`: añadir `authProvider` (String/enum: `LOCAL`, `google.com`, `github.com`, …), `externalId` (uid de Firebase, nullable) y `enabled` (boolean, default true) **solo si aún no existen** (otro compañero puede haberlos añadido; reutiliza lo que haya). Restricción única sobre `(auth_provider, external_id)`.
2. `User.password` pasa a **nullable** (los usuarios OAuth no tienen contraseña). `AuthService.login` debe responder 401 (mismo mensaje que credenciales incorrectas) si el usuario no tiene contraseña.
3. ⚠️ `ddl-auto=update` **no** quita el `NOT NULL` de una columna existente ni rellena filas previas. Entrega un script SQL (`backend/src/main/resources/db/manual/oauth_users.sql` o similar, NO se ejecuta solo) con: `ALTER TABLE users MODIFY password VARCHAR(255) NULL;`, valores por defecto para `auth_provider='LOCAL'` y `enabled=1` en filas existentes. Usa `columnDefinition`/defaults razonables para que las columnas nuevas no fallen con filas existentes.
4. `DatabaseSeeder`: crear el rol **AFICIONADO** con permisos mínimos (p. ej. ninguno administrativo; solo lo que ya exista de "propio perfil" si aplica). No tocar ADMIN/CONSULTOR.

### Fase 2 — Verificación del ID token (backend)
1. Propiedad `firebase.project-id=${FIREBASE_PROJECT_ID:}` en `application.properties`. Si está vacía, el backend debe **fallar claro al usarla** (o al arrancar) con un mensaje explícito, sin bloquear el resto del login normal.
2. Clase `FirebaseTokenVerifier` (`@Component`) con un `NimbusJwtDecoder.withJwkSetUri(...)` (RS256) y validadores: `JwtTimestampValidator`, issuer exacto, audience contiene `projectId`. Método `verify(String idToken)` → devuelve un record/DTO interno `FirebaseIdentity(provider, uid, email, name, picture)`. Cualquier `JwtException` → `ApplicationException` UNAUTHORIZED (401). Sin correo en el token → 400.
3. **No** registrar este decoder como `@Bean JwtDecoder`. Confirma que `oauth2ResourceServer().jwt()` sigue usando el decoder HS256.

### Fase 3 — Endpoint y reglas de negocio (backend)
1. `OAuthRequestDTO{ @NotBlank idToken }` y `POST /api/auth/oauth/firebase` en `AuthController` (o `OAuthController`), respuesta con el mismo DTO de respuesta del login.
2. `resolverUsuario(proveedor, uid, correo, nombre, foto)` (interfaz #14 del contrato; puede estar a cargo de otro compañero — si ya existe, úsala; si no, impleméntala en `UserService` con esta firma):
   - Buscar por `(proveedor, uid)`; si existe, devolverlo.
   - Si no existe y el correo ya está en `users` → 409 (`ALREADY_EXISTS`), sin vincular.
   - Si no, crear usuario con `password=null`, `authProvider`, `externalId`, `enabled=true`, nombre (fallback: parte del correo antes de la `@`) y asignar rol AFICIONADO (vía `UserRole`).
   - Foto: `Profile` hoy exige `phone` y `birthDate` no nulos y no tiene campo `photo`, así que **no inventes cambios de esquema**: deja la foto como `TODO` documentado y repórtalo (el contrato dice que la foto es una decisión abierta).
3. Si `enabled == false` → **403**. Añade soporte de 403 en `ApplicationException`/`GlobalExceptionHandler` (p. ej. caso `FORBIDDEN`) sin romper los existentes. Mantén el formato de error actual `{errorCase, message}` (el contrato pide además un `code` estable, pero eso es un cambio transversal: no lo hagas aquí; solo menciónalo).
4. Emitir el token con **el mismo camino que el login**: extrae un método compartido (p. ej. `AuthService.issueSession(User)`) que genere el JWT con `JwtService` y **persista la fila en `Session`** (jti + expiración). Si el login actual todavía no persiste sesión, haz que ambos usen ese método compartido y avísame explícitamente, porque es un cambio de comportamiento del login. No expongas el jti en DTOs.
5. `SecurityConfig`:
   - Añadir `POST /api/auth/oauth/firebase` a `permitAll` (antes de `anyRequest().access(...)`).
   - Permitir `OPTIONS /**` antes de la autorización dinámica.
   - Configurar CORS con `CorsConfigurationSource`: origen **solo** `http://localhost:3000` (parametrizable con `app.cors.allowed-origins`), métodos GET/POST/PUT/PATCH/DELETE/OPTIONS, headers `Authorization` y `Content-Type`. Habilitarlo en la cadena con `.cors(...)`. Sin `*`.
6. No registrar ni loguear el `idToken` ni el JWT emitido.

### Fase 4 — Pruebas backend
- Unit: `FirebaseTokenVerifier` con tokens firmados con una clave RSA de prueba y un JWK set local (casos: válido, expirado, issuer incorrecto, audience incorrecta, firma inválida, sin email).
- `resolverUsuario`: usuario nuevo (rol AFICIONADO), existente por (proveedor, uid), correo ya usado → 409, deshabilitado → 403.
- Integración (`MockMvc`): endpoint público sin `Authorization`, 401/403/409/400 correctos, preflight OPTIONS desde `http://localhost:3000` responde 200 con CORS.
- Regresión: `POST /api/auth/login` sigue funcionando y un JWT propio sigue siendo validado por el decoder HS256.
- Ejecuta `backend/mvnw test` y deja el resultado.

### Fase 5 — Frontend (Next.js 13 App Router + PrimeReact)
1. Instalar `firebase` (SDK modular, versión compatible con Node/Next 13.4.8). No agregar axios.
2. Variables de entorno en `frontend/.env.local.example` (y documenta copiar a `.env.local`, que ya está ignorado por git):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:<server.port real del backend>
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   ```
3. `frontend/lib/firebase.ts`: inicializa la app una sola vez (evita doble init con HMR) y exporta `auth`.
4. `frontend/lib/api.ts`: wrapper de `fetch` con `baseURL`, `Authorization: Bearer <token>` en rutas protegidas y manejo de errores del backend (`{errorCase, message}`).
   - Regla de interceptor del contrato: un 401 en rutas **públicas** (`/api/auth/login`, `/api/auth/oauth/firebase`, etc.) se muestra en la pantalla; **no** cierra sesión ni redirige. Solo un 401 en rutas protegidas = sesión expirada → limpiar token y enviar a `/auth/login`.
5. `frontend/layout/context/authcontext.tsx` (o ruta equivalente al estilo del proyecto): `AuthProvider` + hook `useAuth()` con `token`, `expiresAt`, `isAuthenticated`, `loginWithGoogle()`, `logout()`. Guardar `token` y `expiresAt` en `localStorage` (acuerdo del contrato; envolver en try/catch y SSR-safe, es `'use client'`). Tratar el token como expirado si `expiresAt` ya pasó.
6. `loginWithGoogle()`:
   - `signInWithPopup(auth, new GoogleAuthProvider())`
   - `const idToken = await user.getIdToken()`
   - `POST {API}/api/auth/oauth/firebase` con `{ idToken }`
   - guardar `{token, expiresAt}`
   - **`signOut(auth)` de Firebase siempre** (en `finally`), porque la sesión real es la del backend
   - navegar a `/` con `router.push`.
7. `app/(full-page)/auth/login/page.tsx`: añadir botón **"Continuar con Google"** (PrimeReact `Button`, icono `pi pi-google`), estado de carga y mensajes de error con `Toast`/`Message` por caso: popup cerrado/bloqueado (códigos `auth/popup-closed-by-user`, `auth/popup-blocked`, `auth/cancelled-popup-request`: mensaje amable, no es error del servidor), 401 "No se pudo validar tu cuenta de Google", 403 "Tu usuario está deshabilitado", 409 "Ese correo ya está registrado con otro método de acceso", 400 "Google no entregó un correo", error de red. Respeta el estilo visual actual (plantilla Sakai/PrimeReact); no rediseñes la pantalla.
8. Protección de rutas: como el token vive en `localStorage`, el `middleware.ts` de Next no puede leerlo. Implementa un guard **de cliente** en el layout del grupo `(main)` que redirija a `/auth/login` si no hay sesión válida (sin parpadeo del contenido protegido: mostrar nada/spinner mientras se resuelve). Las páginas de `(full-page)/auth/*` quedan públicas. Si ya hay sesión y se entra a `/auth/login`, redirigir a `/`.
9. Un botón de "Cerrar sesión" funcional donde hoy exista el menú de usuario/topbar de la plantilla (llama `logout()`; si `POST /api/auth/logout` ya existe en el backend, llámalo antes de limpiar; si no, solo limpia localmente y avísame).
10. No implementes registro, 2FA, recuperación de contraseña ni `/api/auth/me` (son de otros compañeros). Si `/api/auth/me` existe, úsalo opcionalmente para mostrar nombre; si no, no dependas de él.
11. Verifica con `npm run build` y `npm run lint`.

---

## Restricciones
- No hagas commits ni push. No reformatees archivos que no toques. Cambios mínimos y localizados.
- Cero secretos en el código ni en logs; todo por variables de entorno/propiedades. No imprimas valores de `application.properties`.
- No cambies el algoritmo ni el decoder del JWT propio, ni el flujo de `DynamicAuthorizationManager`, salvo lo estrictamente descrito.
- No toques GitHub/Microsoft/otros proveedores; el diseño ya los cubre con el mismo endpoint, pero hoy solo Google.
- Si una decisión no está en este prompt ni en el contrato, elige la opción más simple y segura y déjala anotada en el resumen final.

## Entregables y resumen final
Al terminar dame:
1. Lista de archivos creados/modificados (backend y frontend).
2. Los pasos manuales que me tocan (script SQL a correr, `.env.local`, `FIREBASE_PROJECT_ID`, arranque).
3. Cómo probar de punta a punta: arrancar backend, arrancar frontend, clic en "Continuar con Google", verificar fila en `users` (provider `google.com`, rol AFICIONADO) y fila en `sessions`, y llamar un endpoint protegido con el token.
4. Resultado de `mvnw test`, `npm run build` y `npm run lint`.
5. Lista de discrepancias, riesgos y TODOs (foto de perfil, `code` en errores, sesión en login, permisos de AFICIONADO).
