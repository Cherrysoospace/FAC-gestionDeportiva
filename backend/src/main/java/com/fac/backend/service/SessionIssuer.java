package com.fac.backend.service;

import com.fac.backend.dto.AuthResponseDTO;
import com.fac.backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Último paso común de cualquier login (HU-SE-08): emite el JWT y guarda la
 * sesión interna con su expiración, para que el logout pueda invalidarla.
 */
@Component
@RequiredArgsConstructor
public class SessionIssuer {

    private final JwtService jwtService;
    private final SessionService sessionService;

    public AuthResponseDTO issue(User user) {
        JwtService.IssuedToken issued = jwtService.generateToken(user);

        sessionService.registerAuthenticatedSession(
                user,
                issued.jti(),
                issued.expiresAt()
        );

        return issued.response();
    }
}
