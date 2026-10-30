package com.fac.backend.dto.twofactor;

import java.time.Instant;

/**
 * Reto 2FA pendiente que recibe el frontend tras validar la contraseña.
 *
 * @param challengeId      identifica este intento de login; se envía junto al código
 * @param expiresAt        momento en que el código deja de ser válido
 * @param resendAvailableAt desde cuándo se puede pedir un código nuevo
 * @param destination      correo enmascarado al que se envió el código
 */
public record TwoFactorChallengeDTO(
        String challengeId,
        Instant expiresAt,
        Instant resendAvailableAt,
        String destination) {
}
