package com.fac.backend.security;

import com.fac.backend.entity.User;

public final class AuthProviders {

    private AuthProviders() {
    }

    // Nombre legible del método de acceso, o null si el proveedor no se conoce
    public static String label(String authProvider) {
        if (authProvider == null) {
            return null;
        }

        return switch (authProvider) {
            case User.LOCAL_AUTH_PROVIDER -> "correo y contraseña";
            case "google.com" -> "Google";
            case "github.com" -> "GitHub";
            case "discord" -> "Discord";
            default -> null;
        };
    }
}
