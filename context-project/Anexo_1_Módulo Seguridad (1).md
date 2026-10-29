**Historias de Usuario -- Módulo de Seguridad**

El módulo de seguridad permitirá administrar los usuarios del sistema, sus roles y los permisos que determinan las funcionalidades a las que puede acceder cada usuario. De acuerdo con el modelo y los mockups, la autorización se realizará principalmente mediante la asignación de permisos a roles y la posterior asignación de roles a los usuarios.

**HU-SE-01 -- Gestionar usuarios**

**Historia de usuario:**\
Como administrador del sistema, quiero gestionar los usuarios registrados en la plataforma, para controlar las personas que pueden acceder al sistema.

**Criterios de aceptación:**

- El sistema debe permitir registrar usuarios con la información requerida.

- El correo electrónico debe ser único para cada usuario.

- La contraseña debe almacenarse de manera segura.

- El sistema debe permitir consultar el listado de usuarios registrados.

- Se debe poder consultar la información detallada de un usuario.

- Se debe permitir actualizar la información de un usuario.

- Se debe permitir eliminar o desactivar un usuario cuando las reglas del sistema lo permitan.

- Desde el listado de usuarios se debe permitir acceder a la gestión de su perfil y sus roles.

- La eliminación o desactivación de un usuario no debe eliminar los roles o permisos existentes en el sistema.

**HU-SE-02 -- Gestionar perfiles de usuario**

**Historia de usuario:**\
Como usuario, quiero gestionar la información de mi perfil, para mantener actualizados mis datos personales dentro de la plataforma.

**Criterios de aceptación:**

- El usuario debe estar previamente registrado.

- Cada usuario debe tener como máximo un perfil asociado.

- El sistema debe permitir consultar la información del perfil.

- Se debe permitir registrar o actualizar información como teléfono y fotografía.

- La información del perfil debe estar asociada únicamente con el usuario correspondiente.

- La modificación del perfil no debe alterar la información de autenticación del usuario.

- Los cambios realizados deben quedar almacenados correctamente.

**HU-SE-03 -- Gestionar roles**

**Historia de usuario:**\
Como administrador del sistema, quiero gestionar los roles de la plataforma, para definir los diferentes niveles de acceso que pueden ser asignados a los usuarios.

**Criterios de aceptación:**

- El sistema debe permitir registrar un rol indicando como mínimo su nombre y descripción.

- No se deben permitir roles duplicados con el mismo nombre.

- El sistema debe permitir consultar los roles registrados.

- Se debe poder consultar la información detallada de cada rol.

- Se debe permitir actualizar la información de un rol.

- Se debe permitir eliminar un rol cuando no existan restricciones que lo impidan.

- Antes de eliminar un rol, el sistema debe validar si se encuentra asignado a usuarios.

- Desde la consulta de un rol se debe poder acceder a la gestión de sus usuarios y permisos.

- Eliminar un rol no debe eliminar los usuarios ni los permisos existentes en la plataforma.

**HU-SE-04 -- Asignar roles a usuarios**

**Historia de usuario:**\
Como administrador del sistema, quiero asignar uno o varios roles a los usuarios, para determinar las funciones que cada usuario podrá realizar dentro de la plataforma.

**Criterios de aceptación:**

- El usuario y el rol deben estar previamente registrados.

- El sistema debe permitir seleccionar un rol y consultar los usuarios que lo tienen asignado.

- Desde la consulta del rol se debe permitir agregar nuevos usuarios.

- El sistema debe mostrar los usuarios disponibles para ser asignados al rol.

- Un usuario puede tener uno o varios roles.

- Un rol puede estar asociado con varios usuarios.

- No se debe permitir asignar dos veces el mismo rol al mismo usuario.

- El sistema debe permitir retirar un usuario de un rol.

- Retirar el rol no debe eliminar al usuario ni al rol del sistema.

- Los cambios en la asignación deben reflejarse en los permisos efectivos del usuario.

- El sistema debe solicitar confirmación cuando se retire un rol de un usuario.

**HU-SE-05 -- Gestionar permisos**

**Historia de usuario:**\
Como administrador del sistema, quiero gestionar los permisos disponibles en la plataforma, para establecer las operaciones que posteriormente podrán ser autorizadas a los diferentes roles.

**Criterios de aceptación:**

- El sistema debe permitir registrar un permiso.

- Cada permiso debe permitir identificar el recurso o módulo sobre el que se aplica.

- El permiso debe permitir indicar la operación que autoriza.

- Se debe poder asociar información como la URL, el método HTTP y el modelo o recurso correspondiente.

- El sistema debe permitir consultar el listado de permisos registrados.

- Se debe poder consultar el detalle de un permiso.

- Se debe permitir actualizar la información de un permiso.

- Se debe permitir eliminar un permiso cuando las reglas del sistema lo permitan.

- El sistema debe evitar registrar permisos duplicados para la misma operación y recurso.

- La eliminación de un permiso no debe eliminar los roles a los que estuviera asociado.

**HU-SE-06 -- Asignar permisos a roles**

**Historia de usuario:**\
Como administrador del sistema, quiero asignar y retirar permisos a los diferentes roles, para controlar de manera centralizada las operaciones que pueden realizar los usuarios que poseen cada rol.

**Criterios de aceptación:**

- El rol debe estar previamente registrado en el sistema.

- Los permisos deben estar previamente registrados.

- El sistema debe permitir seleccionar el rol cuyos permisos se desean administrar.

- Al seleccionar un rol, se deben mostrar los permisos actualmente asignados.

- Los permisos deben presentarse agrupados de acuerdo con el módulo, recurso o modelo al que pertenecen.

- El sistema debe permitir visualizar los permisos mediante una matriz similar a la presentada en el mockup.

- Para cada recurso se deben poder identificar operaciones como:

  - Ver.

  - Listar.

  - Crear.

  - Actualizar.

  - Eliminar.

- El administrador debe poder asignar un permiso marcando la opción correspondiente.

- El administrador debe poder retirar un permiso desmarcando la opción correspondiente.

- Un rol puede tener varios permisos.

- Un mismo permiso puede estar asociado con varios roles.

- No se debe permitir registrar dos veces la misma asociación entre un rol y un permiso.

- Al consultar un rol, la matriz debe mostrar marcados únicamente los permisos que actualmente tiene asignados.

- Los cambios realizados en la matriz deben poder almacenarse mediante una acción de guardar o actualizar.

- Retirar un permiso de un rol no debe eliminar el permiso del sistema.

- Los cambios realizados deben aplicarse a todos los usuarios que tengan asignado el rol.

- Si un usuario intenta ejecutar una operación para la cual ninguno de sus roles tiene permiso, el sistema debe impedir el acceso.

- Si al menos uno de los roles del usuario posee el permiso requerido, el sistema debe permitir la operación.

- Los permisos asignados deben mantenerse después de cerrar e iniciar nuevamente sesión.

**HU-SE-07 -- Registrar usuario mediante credenciales**

**Historia de usuario:**\
Como nuevo usuario, quiero registrarme utilizando mis datos y una contraseña, para crear una cuenta que me permita acceder a la plataforma mediante autenticación tradicional.

**Criterios de aceptación:**

- El sistema debe permitir registrar una cuenta utilizando como mínimo nombre, correo electrónico y contraseña.

- El correo electrónico debe ser único dentro de la plataforma.

- El sistema debe validar los campos obligatorios antes de crear la cuenta.

- La contraseña debe cumplir con las condiciones de seguridad establecidas por el sistema.

- La contraseña no debe almacenarse en texto plano.

- Al completar correctamente el registro, se debe crear un usuario en el sistema.

- El usuario registrado mediante este mecanismo debe poder autenticarse posteriormente utilizando su correo electrónico y contraseña.

- El sistema debe informar cuando el correo electrónico ya se encuentre registrado.

- Los usuarios que utilicen autenticación mediante OAuth no deben realizar este proceso de registro manual.

**HU-SE-08 -- Autenticarse y gestionar sesión**

**Historia de usuario:**\
Como usuario, quiero autenticarme mediante credenciales o utilizando un proveedor externo de identidad, para acceder de manera segura a las funcionalidades que tengo autorizadas en la plataforma.

**Criterios de aceptación:**

- El sistema debe ofrecer dos mecanismos de autenticación:

  1.  Correo electrónico y contraseña.

  2.  Autenticación OAuth mediante proveedores externos.

- Entre los proveedores OAuth disponibles se deben contemplar Google, GitHub y otro proveedor de autenticación.

- Cuando el usuario seleccione autenticación mediante correo electrónico y contraseña, debe existir previamente una cuenta registrada en la plataforma.

- El sistema debe validar que las credenciales ingresadas correspondan con un usuario registrado y habilitado.

- Si las credenciales son incorrectas, el sistema debe impedir el acceso.

- Si el usuario tiene habilitada la autenticación de dos factores, después de validar su correo y contraseña se debe solicitar el segundo factor de autenticación.

- La sesión no debe quedar completamente autenticada hasta que se valide correctamente el segundo factor cuando este sea requerido.

- Cuando el usuario seleccione autenticación mediante OAuth, la validación de identidad debe ser realizada por el proveedor externo seleccionado.

- Un usuario que ingrese mediante OAuth no debe proporcionar una contraseña propia de la plataforma.

- Un usuario autenticado mediante OAuth no debe requerir el mecanismo de 2FA administrado por la plataforma, debido a que la autenticación depende del proveedor externo.

- Cuando una persona se autentique por primera vez mediante OAuth y no exista un usuario asociado, el sistema debe crear automáticamente su usuario utilizando la información proporcionada por el proveedor.

- En caso de que ya se haya utilizado el correo electrónico por el sistema de autenticación básico y se quiera usar OAuth se debe rechazar el inicio de sesión.

- En posteriores accesos mediante el mismo proveedor, el sistema debe identificar al usuario previamente creado y no generar un nuevo registro.

- El sistema debe evitar la creación de usuarios duplicados cuando corresponda.

- Independientemente del mecanismo de autenticación utilizado, al completar correctamente el acceso el sistema debe generar una sesión interna asociada con el usuario

- Cada sesión debe almacenar como mínimo un identificador o token y una fecha de expiración.

- La sesión debe permitir identificar al usuario autenticado.

- Una sesión expirada no debe permitir realizar nuevas operaciones protegidas.

- El sistema debe permitir cerrar la sesión.

- Al cerrar sesión, el token asociado debe dejar de ser válido.

- Un usuario debe poder iniciar nuevamente una sesión después de cerrar o expirar una sesión anterior.

- Una vez autenticado, el acceso a las funcionalidades debe determinarse según los roles y permisos asociados con el usuario.

**HU-SE-09 -- Recuperar contraseña**

**Historia de usuario:**\
Como usuario registrado mediante correo electrónico y contraseña, quiero recuperar el acceso a mi cuenta cuando olvide mi contraseña, para poder establecer una nueva contraseña e ingresar nuevamente a la plataforma.

**Criterios de aceptación:**

- La recuperación de contraseña debe estar disponible únicamente para usuarios que tengan autenticación mediante correo electrónico y contraseña.

- El sistema debe permitir solicitar la recuperación indicando el correo electrónico asociado con la cuenta.

- El sistema debe generar un mecanismo temporal de recuperación de contraseña.

- El mecanismo de recuperación debe tener un periodo limitado de validez.

- El sistema debe permitir establecer una nueva contraseña cuando la solicitud de recuperación sea válida.

- La nueva contraseña debe cumplir con las reglas de seguridad establecidas.

- Una vez utilizada correctamente la solicitud de recuperación, esta no debe poder utilizarse nuevamente.

- Una solicitud expirada debe ser rechazada.

- Después de modificar la contraseña, el usuario debe poder iniciar sesión utilizando la nueva contraseña.

- Cuando corresponda, el sistema debe invalidar las sesiones anteriores del usuario después del cambio de contraseña.

- Los usuarios registrados únicamente mediante Google, GitHub, Microsoft u otro proveedor OAuth no deben recuperar su contraseña desde la plataforma.

- Si un usuario OAuth necesita recuperar sus credenciales, deberá realizar el proceso directamente con el proveedor correspondiente.

**HU-SE-10 -- Gestionar autenticación de dos factores**

**Historia de usuario:**\
Como usuario que accede mediante correo electrónico y contraseña, quiero utilizar autenticación de dos factores, para agregar una capa adicional de seguridad al acceso a mi cuenta.

**Criterios de aceptación:**

- La autenticación de dos factores debe aplicar únicamente a usuarios que utilicen autenticación mediante correo electrónico y contraseña.

- El sistema debe permitir habilitar o deshabilitar el segundo factor cuando las reglas de seguridad lo permitan.

- Después de validar correctamente el correo y la contraseña, el sistema debe solicitar un código de verificación cuando el usuario tenga 2FA habilitado.

- El código de verificación debe estar asociado con el proceso de autenticación o sesión que se está iniciando.

- El código debe tener un periodo limitado de validez.

- El sistema debe validar el código antes de considerar autenticado al usuario.

- Un código incorrecto o expirado no debe permitir completar el inicio de sesión.

- Una vez utilizado correctamente, el código no debe poder utilizarse nuevamente.

- Después de validar correctamente el segundo factor, la sesión debe quedar activa.

- La sesión activa debe contar con su token y fecha de expiración correspondiente.

- Si el usuario cancela el proceso o no completa el segundo factor, no debe obtener acceso a las funcionalidades protegidas.

- Los usuarios autenticados mediante OAuth no deben pasar por este mecanismo de 2FA interno.

- Para usuarios OAuth, la plataforma debe confiar en el proceso de autenticación y las medidas de seguridad implementadas por Google, GitHub, Microsoft o el proveedor correspondiente.

**Flujo general de autenticación**

**Mecanismo 1 -- Credenciales propias**

Registro → Correo + contraseña → Validación → 2FA (si está habilitado) → Sesión → Roles y permisos

**Mecanismo 2 -- OAuth**

Google / GitHub / Microsoft → Validación del proveedor → Crear o identificar usuario → Sesión → Roles y permisos

En ambos casos el resultado final es el mismo: existe un **usuario interno** y se crea una **sesión interna**. La diferencia está únicamente en quién valida inicialmente la identidad del usuario.
