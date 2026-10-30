package com.fac.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuración de la autenticación de dos factores (prefijo app.two-factor).
 *
 * @param codeLength            cantidad de dígitos del código
 * @param expirationMinutes     vigencia del código enviado por correo
 * @param maxAttempts           intentos fallidos antes de anular el reto
 * @param resendCooldownSeconds espera mínima entre reenvíos del código
 */
@ConfigurationProperties(prefix = "app.two-factor")
public record TwoFactorProperties(
        int codeLength,
        long expirationMinutes,
        int maxAttempts,
        long resendCooldownSeconds) {

    public TwoFactorProperties {
        if (codeLength < 6 || codeLength > 10) {
            codeLength = 6;
        }
        if (expirationMinutes <= 0) {
            expirationMinutes = 5;
        }
        if (maxAttempts <= 0) {
            maxAttempts = 5;
        }
        if (resendCooldownSeconds < 0) {
            resendCooldownSeconds = 30;
        }
    }
}
