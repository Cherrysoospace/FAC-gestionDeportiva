package com.fac.backend.dto;

import com.fac.backend.dto.twofactor.TwoFactorChallengeDTO;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * Resultado del login con correo y contraseña.
 * Sin 2FA trae el token de la sesión; con 2FA trae solo el reto pendiente
 * y ningún token, así que no se puede acceder a nada protegido todavía.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record LoginResponseDTO(
        boolean twoFactorRequired,
        String accessToken,
        String tokenType,
        Instant expiresAt,
        TwoFactorChallengeDTO twoFactor) {

    public static LoginResponseDTO authenticated(AuthResponseDTO session) {
        return new LoginResponseDTO(
                false,
                session.accessToken(),
                session.tokenType(),
                session.expiresAt(),
                null
        );
    }

    public static LoginResponseDTO twoFactorRequired(TwoFactorChallengeDTO challenge) {
        return new LoginResponseDTO(true, null, null, null, challenge);
    }
}
