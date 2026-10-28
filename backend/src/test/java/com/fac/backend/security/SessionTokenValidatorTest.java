package com.fac.backend.security;

import com.fac.backend.entity.Session;
import com.fac.backend.entity.User;
import com.fac.backend.repository.SessionRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionTokenValidatorTest {

    @Mock
    private SessionRepository sessionRepository;

    @InjectMocks
    private SessionTokenValidator validator;

    @Test
    void acceptsActiveSession() {
        Session session = session(LocalDateTime.now().plusMinutes(10), null, true);
        when(sessionRepository.findByJti("jti-1"))
                .thenReturn(Optional.of(session));

        OAuth2TokenValidatorResult result = validator.validate(jwt("jti-1"));

        assertFalse(result.hasErrors());
    }

    @Test
    void rejectsExpiredSession() {
        Session session = session(LocalDateTime.now().minusSeconds(1), null, true);
        when(sessionRepository.findByJti("jti-1"))
                .thenReturn(Optional.of(session));

        OAuth2TokenValidatorResult result = validator.validate(jwt("jti-1"));

        assertTrue(result.hasErrors());
    }

    @Test
    void rejectsClosedSession() {
        Session session = session(
                LocalDateTime.now().plusMinutes(10),
                LocalDateTime.now(),
                true
        );
        when(sessionRepository.findByJti("jti-1"))
                .thenReturn(Optional.of(session));

        OAuth2TokenValidatorResult result = validator.validate(jwt("jti-1"));

        assertTrue(result.hasErrors());
    }

    @Test
    void rejectsSessionOfDisabledUser() {
        Session session = session(
                LocalDateTime.now().plusMinutes(10),
                null,
                false
        );
        when(sessionRepository.findByJti("jti-1"))
                .thenReturn(Optional.of(session));

        OAuth2TokenValidatorResult result = validator.validate(jwt("jti-1"));

        assertTrue(result.hasErrors());
    }

    @Test
    void rejectsUnknownSession() {
        when(sessionRepository.findByJti("jti-1"))
                .thenReturn(Optional.empty());

        OAuth2TokenValidatorResult result = validator.validate(jwt("jti-1"));

        assertTrue(result.hasErrors());
    }

    @Test
    void rejectsTokenWithoutSessionIdentifier() {
        OAuth2TokenValidatorResult result = validator.validate(
                Jwt.withTokenValue("token")
                        .header("alg", "HS256")
                        .subject("1")
                        .build()
        );

        assertTrue(result.hasErrors());
        verifyNoInteractions(sessionRepository);
    }

    private Jwt jwt(String jti) {
        return Jwt.withTokenValue("token")
                .header("alg", "HS256")
                .subject("1")
                .claim("jti", jti)
                .build();
    }

    private Session session(
            LocalDateTime expiresAt,
            LocalDateTime invalidatedAt,
            boolean userEnabled) {

        User user = new User();
        user.setId(1L);
        user.setName("User");
        user.setEmail("user@example.com");
        user.setEnabled(userEnabled);

        Session session = new Session();
        session.setJti("jti-1");
        session.setExpiresAt(expiresAt);
        session.setInvalidatedAt(invalidatedAt);
        session.setUser(user);
        return session;
    }
}
