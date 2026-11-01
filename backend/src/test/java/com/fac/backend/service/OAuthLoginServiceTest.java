package com.fac.backend.service;

import com.fac.backend.dto.AuthResponseDTO;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.security.ExternalIdentity;
import com.fac.backend.security.IdentityTokenVerifier;
import com.fac.backend.security.OAuthCodeProviderStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * El login social depende solo de abstracciones (DIP): aquí Google/GitHub y
 * Discord se reemplazan por dobles de prueba, sin Firebase ni HTTP.
 */
class OAuthLoginServiceTest {

    private static final String REDIRECT = "http://localhost:3000/auth/discord/callback";

    private final ExternalIdentity googleIdentity = new ExternalIdentity(
            "google.com", "uid-1", "google@example.com", "Google User", null);
    private final ExternalIdentity discordIdentity = new ExternalIdentity(
            "discord", "discord-123", "fercho@example.com", "Fercho", null);

    private OAuthAccountProvisioner provisioner;
    private SessionIssuer sessionIssuer;
    private OAuthLoginService service;

    @BeforeEach
    void setUp() {
        provisioner = mock(OAuthAccountProvisioner.class);
        sessionIssuer = mock(SessionIssuer.class);

        // Implementaciones mínimas de las interfaces: el servicio no sabe cuál es cuál
        IdentityTokenVerifier tokenVerifier = idToken -> {
            if (!"valid-token".equals(idToken)) {
                throw new ApplicationException(ErrorCase.UNAUTHORIZED, "Token inválido");
            }
            return googleIdentity;
        };
        OAuthCodeProviderStrategy discord = new OAuthCodeProviderStrategy() {
            @Override
            public boolean supports(String provider) {
                return "discord".equals(provider);
            }

            @Override
            public ExternalIdentity authenticate(String code, String redirectUri) {
                return discordIdentity;
            }
        };

        service = new OAuthLoginService(
                tokenVerifier,
                List.of(discord),
                provisioner,
                new AccountStatusPolicy(),
                sessionIssuer
        );
    }

    @Test
    void idTokenLoginResolvesUserAndIssuesSession() {
        User user = user(true);
        AuthResponseDTO session = session();
        when(provisioner.resolve(googleIdentity)).thenReturn(user);
        when(sessionIssuer.issue(user)).thenReturn(session);

        assertSame(session, service.loginWithIdToken("valid-token"));
    }

    @Test
    void invalidIdTokenNeverReachesUserResolution() {
        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> service.loginWithIdToken("bad-token")
        );

        assertEquals(ErrorCase.UNAUTHORIZED, exception.getErrorCase());
        verify(provisioner, never()).resolve(any());
        verify(sessionIssuer, never()).issue(any());
    }

    @Test
    void disabledUserDoesNotGetSession() {
        User user = user(false);
        when(provisioner.resolve(googleIdentity)).thenReturn(user);

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> service.loginWithIdToken("valid-token")
        );

        assertEquals(ErrorCase.FORBIDDEN, exception.getErrorCase());
        verify(sessionIssuer, never()).issue(any());
    }

    @Test
    void authorizationCodeLoginUsesTheMatchingStrategy() {
        User user = user(true);
        AuthResponseDTO session = session();
        when(provisioner.resolve(discordIdentity)).thenReturn(user);
        when(sessionIssuer.issue(user)).thenReturn(session);

        assertSame(session, service.loginWithAuthorizationCode("discord", "code-abc", REDIRECT));
    }

    @Test
    void unknownCodeProviderIsRejected() {
        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> service.loginWithAuthorizationCode("myspace", "code", REDIRECT)
        );

        assertEquals(ErrorCase.INVALID_OPERATION, exception.getErrorCase());
        verify(provisioner, never()).resolve(any());
    }

    private AuthResponseDTO session() {
        return new AuthResponseDTO("jwt-token", "Bearer", Instant.now().plusSeconds(900));
    }

    private User user(boolean enabled) {
        User user = new User();
        user.setId(1L);
        user.setEmail("user@example.com");
        user.setEnabled(enabled);
        return user;
    }
}
