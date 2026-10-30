package com.fac.backend.security;

/**
 * Contrato (Patrón Strategy + Inversión de Dependencias) para proveedores
 * OAuth 2.0 que autentican mediante intercambio de authorization code.
 */
public interface OAuthCodeProviderStrategy {

    boolean supports(String provider);

    FirebaseIdentity authenticate(String code, String redirectUri);
}

