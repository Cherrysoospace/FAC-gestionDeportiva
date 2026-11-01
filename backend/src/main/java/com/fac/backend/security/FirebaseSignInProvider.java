package com.fac.backend.security;

import java.util.Arrays;
import java.util.Optional;

/**
 * Proveedores que se aceptan a través de Firebase y sus reglas propias.
 * Agregar uno (por ejemplo Microsoft) es sumar una constante aquí, sin
 * modificar la verificación del token (abierto a extensión).
 */
public enum FirebaseSignInProvider {

    GOOGLE("google.com", true),
    GITHUB("github.com", false);

    private final String signInProvider;
    private final boolean requiresVerifiedEmail;

    FirebaseSignInProvider(String signInProvider, boolean requiresVerifiedEmail) {
        this.signInProvider = signInProvider;
        this.requiresVerifiedEmail = requiresVerifiedEmail;
    }

    /** Valor del claim firebase.sign_in_provider, que también se guarda como proveedor del usuario. */
    public String signInProvider() {
        return signInProvider;
    }

    /** Google confirma el correo; GitHub puede entregar correos sin verificar. */
    public boolean requiresVerifiedEmail() {
        return requiresVerifiedEmail;
    }

    public static Optional<FirebaseSignInProvider> from(String signInProvider) {
        return Arrays.stream(values())
                .filter(provider -> provider.signInProvider.equals(signInProvider))
                .findFirst();
    }
}
