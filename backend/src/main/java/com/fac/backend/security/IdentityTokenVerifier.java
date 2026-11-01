package com.fac.backend.security;

/**
 * Abstracción (DIP) para los proveedores que entregan un token de identidad
 * firmado (ID token), como Google y GitHub a través de Firebase.
 * <p>
 * Los servicios de login dependen de esta interfaz, no de Firebase: cambiar
 * de proveedor o probar con un doble solo requiere otra implementación.
 */
public interface IdentityTokenVerifier {

    /**
     * Valida el token y devuelve la identidad de la persona.
     * Lanza una ApplicationException si el token no es válido.
     */
    ExternalIdentity verify(String idToken);
}
