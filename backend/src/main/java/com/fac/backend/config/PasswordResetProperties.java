package com.fac.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuración de la recuperación de contraseña (prefijo app.password-reset).
 *
 * @param expirationMinutes vigencia del enlace de recuperación
 * @param resetUrl          pantalla del frontend que recibe el token
 */
@ConfigurationProperties(prefix = "app.password-reset")
public record PasswordResetProperties(
        long expirationMinutes,
        String resetUrl) {

    public PasswordResetProperties {
        if (expirationMinutes <= 0) {
            expirationMinutes = 30;
        }
        if (resetUrl == null || resetUrl.isBlank()) {
            resetUrl = "http://localhost:3000/auth/reset-password";
        }
    }
}
