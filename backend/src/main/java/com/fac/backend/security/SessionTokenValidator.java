package com.fac.backend.security;

import com.fac.backend.entity.Session;
import com.fac.backend.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SessionTokenValidator implements OAuth2TokenValidator<Jwt> {

    private final SessionRepository sessionRepository;

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        String jti = jwt.getId();
        if (jti == null || jti.isBlank()) {
            return invalidToken();
        }

        Session session = sessionRepository.findByJti(jti).orElse(null);
        if (session == null
                || session.isInvalidated()
                || session.isExpired()
                || !session.getUser().isEnabled()) {
            return invalidToken();
        }

        return OAuth2TokenValidatorResult.success();
    }

    private OAuth2TokenValidatorResult invalidToken() {
        return OAuth2TokenValidatorResult.failure(new OAuth2Error(
                OAuth2ErrorCodes.INVALID_TOKEN,
                "La sesión no es válida",
                null
        ));
    }
}
