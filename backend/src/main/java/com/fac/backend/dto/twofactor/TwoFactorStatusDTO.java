package com.fac.backend.dto.twofactor;

/**
 * Estado del 2FA en el perfil del usuario autenticado.
 *
 * @param enabled   si el segundo factor está activo
 * @param available si la cuenta puede usarlo (solo correo y contraseña)
 */
public record TwoFactorStatusDTO(
        boolean enabled,
        boolean available) {
}
