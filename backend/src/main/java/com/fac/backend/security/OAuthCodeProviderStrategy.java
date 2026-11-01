package com.fac.backend.security;

/**
 * Abstracción (Strategy + DIP) para los proveedores OAuth 2.0 que autentican
 * intercambiando un authorization code (por ejemplo Discord).
 * Agregar un proveedor nuevo es crear otra implementación, sin tocar el login.
 */
public interface OAuthCodeProviderStrategy {

    boolean supports(String provider);

    ExternalIdentity authenticate(String code, String redirectUri);
}
