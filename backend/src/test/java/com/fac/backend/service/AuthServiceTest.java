package com.fac.backend.service;

import com.fac.backend.dto.AuthResponseDTO;
import com.fac.backend.dto.LoginRequestDTO;
import com.fac.backend.dto.LoginResponseDTO;
import com.fac.backend.dto.twofactor.TwoFactorChallengeDTO;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.security.FirebaseIdentity;
import com.fac.backend.security.FirebaseTokenVerifier;
import com.fac.backend.security.OAuthCodeProviderStrategy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private SessionService sessionService;

    @Mock
    private UserService userService;

    @Mock
    private FirebaseTokenVerifier firebaseTokenVerifier;

    @Mock
    private TwoFactorService twoFactorService;

    @Mock
    private OAuthCodeProviderStrategy oauthCodeProviderStrategy;

    @InjectMocks
    private AuthService authService;

    @Test
    void loginIssuesAndPersistsSession() {
        User user = user(true);
        user.setPassword("encoded-password");

        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail(user.getEmail());
        dto.setPassword("secret");

        when(userRepository.findByEmailIgnoreCase(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "encoded-password"))
                .thenReturn(true);

        Instant expiresAt = Instant.now().plusSeconds(900);
        AuthResponseDTO response = new AuthResponseDTO(
                "jwt-token",
                "Bearer",
                expiresAt
        );
        when(jwtService.generateToken(user)).thenReturn(
                new JwtService.IssuedToken(response, "jti-1", expiresAt)
        );

        LoginResponseDTO result = authService.login(dto);

        assertFalse(result.twoFactorRequired());
        assertEquals("jwt-token", result.accessToken());
        assertEquals(expiresAt, result.expiresAt());
        assertNull(result.twoFactor());
        verify(sessionService).registerAuthenticatedSession(
                user,
                "jti-1",
                expiresAt
        );
        verifyNoInteractions(twoFactorService);
    }

    @Test
    void loginWithTwoFactorReturnsChallengeWithoutSession() {
        User user = user(true);
        user.setPassword("encoded-password");
        user.setTwoFactorEnabled(true);

        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail(user.getEmail());
        dto.setPassword("secret");

        when(userRepository.findByEmailIgnoreCase(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "encoded-password"))
                .thenReturn(true);

        TwoFactorChallengeDTO challenge = new TwoFactorChallengeDTO(
                "challenge-1",
                Instant.now().plusSeconds(300),
                Instant.now().plusSeconds(30),
                "us***@example.com"
        );
        when(twoFactorService.startChallenge(user)).thenReturn(challenge);

        LoginResponseDTO result = authService.login(dto);

        assertTrue(result.twoFactorRequired());
        assertNull(result.accessToken());
        assertSame(challenge, result.twoFactor());
        verifyNoInteractions(jwtService, sessionService);
    }

    @Test
    void completeTwoFactorLoginIssuesSessionAfterValidCode() {
        User user = user(true);

        when(twoFactorService.verify("challenge-1", "123456"))
                .thenReturn(user);

        Instant expiresAt = Instant.now().plusSeconds(900);
        AuthResponseDTO response = new AuthResponseDTO(
                "jwt-token",
                "Bearer",
                expiresAt
        );
        when(jwtService.generateToken(user)).thenReturn(
                new JwtService.IssuedToken(response, "jti-3", expiresAt)
        );

        AuthResponseDTO result =
                authService.completeTwoFactorLogin("challenge-1", "123456");

        assertSame(response, result);
        verify(sessionService).registerAuthenticatedSession(
                user,
                "jti-3",
                expiresAt
        );
    }

    @Test
    void completeTwoFactorLoginWithInvalidCodeDoesNotIssueSession() {
        when(twoFactorService.verify("challenge-1", "000000"))
                .thenThrow(new ApplicationException(
                        ErrorCase.INVALID_OPERATION,
                        "El código de verificación es incorrecto o ya expiró"
                ));

        assertThrows(
                ApplicationException.class,
                () -> authService.completeTwoFactorLogin("challenge-1", "000000")
        );

        verifyNoInteractions(jwtService, sessionService);
    }

    @Test
    void loginRejectsUserWithoutPassword() {
        User user = user(true);
        user.setPassword(null);

        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail(user.getEmail());
        dto.setPassword("secret");

        when(userRepository.findByEmailIgnoreCase(user.getEmail()))
                .thenReturn(Optional.of(user));

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> authService.login(dto)
        );

        assertEquals(ErrorCase.UNAUTHORIZED, exception.getErrorCase());
        verify(jwtService, never()).generateToken(user);
        verifyNoInteractions(sessionService);
    }

    @Test
    void loginTellsOauthUserWhichProviderToUse() {
        User user = user(true);
        user.setPassword(null);
        user.setAuthProvider("github.com");

        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail(user.getEmail());
        dto.setPassword("secret");

        when(userRepository.findByEmailIgnoreCase(user.getEmail()))
                .thenReturn(Optional.of(user));

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> authService.login(dto)
        );

        assertEquals(ErrorCase.UNAUTHORIZED, exception.getErrorCase());
        assertEquals(
                "Esta cuenta usa GitHub. Inicia sesión con GitHub.",
                exception.getMessage()
        );
        verifyNoInteractions(sessionService);
    }

    @Test
    void loginRejectsDisabledUser() {
        User user = user(false);
        user.setPassword("encoded-password");

        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail(user.getEmail());
        dto.setPassword("secret");

        when(userRepository.findByEmailIgnoreCase(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "encoded-password"))
                .thenReturn(true);

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> authService.login(dto)
        );

        assertEquals(ErrorCase.FORBIDDEN, exception.getErrorCase());
    }

    @Test
    void firebaseLoginResolvesUserAndIssuesSession() {
        FirebaseIdentity identity = new FirebaseIdentity(
                "google.com",
                "uid-1",
                "google@example.com",
                "Google User",
                null
        );
        User user = user(true);

        when(firebaseTokenVerifier.verify("id-token"))
                .thenReturn(identity);
        when(userService.resolverUsuario(
                "google.com",
                "uid-1",
                "google@example.com",
                "Google User",
                null
        )).thenReturn(user);

        Instant expiresAt = Instant.now().plusSeconds(900);
        AuthResponseDTO response = new AuthResponseDTO(
                "jwt-token",
                "Bearer",
                expiresAt
        );
        when(jwtService.generateToken(user)).thenReturn(
                new JwtService.IssuedToken(response, "jti-2", expiresAt)
        );

        AuthResponseDTO result = authService.loginWithFirebase("id-token");

        assertSame(response, result);
        verify(twoFactorService, never()).startChallenge(any());
        verify(sessionService).registerAuthenticatedSession(
                user,
                "jti-2",
                expiresAt
        );
    }

    @Test
    void firebaseLoginRejectsDisabledUser() {
        FirebaseIdentity identity = new FirebaseIdentity(
                "google.com",
                "uid-2",
                "disabled@example.com",
                "Disabled",
                null
        );
        User user = user(false);

        when(firebaseTokenVerifier.verify("id-token"))
                .thenReturn(identity);
        when(userService.resolverUsuario(
                "google.com",
                "uid-2",
                "disabled@example.com",
                "Disabled",
                null
        )).thenReturn(user);

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> authService.loginWithFirebase("id-token")
        );

        assertEquals(ErrorCase.FORBIDDEN, exception.getErrorCase());
        verify(jwtService, never()).generateToken(user);
    }

    @Test
    void discordLoginUsesStrategyResolvesUserAndIssuesSession() {
        FirebaseIdentity identity = new FirebaseIdentity(
                "discord",
                "discord-123",
                "fercho@example.com",
                "Fercho",
                null
        );
        User user = user(true);

        when(oauthCodeProviderStrategy.authenticate(
                "code-abc",
                "http://localhost:3000/auth/discord/callback"
        )).thenReturn(identity);
        when(userService.resolverUsuario(
                "discord",
                "discord-123",
                "fercho@example.com",
                "Fercho",
                null
        )).thenReturn(user);

        Instant expiresAt = Instant.now().plusSeconds(900);
        AuthResponseDTO response = new AuthResponseDTO(
                "jwt-token",
                "Bearer",
                expiresAt
        );
        when(jwtService.generateToken(user)).thenReturn(
                new JwtService.IssuedToken(response, "jti-discord", expiresAt)
        );

        AuthResponseDTO result = authService.loginWithDiscord(
                "code-abc",
                "http://localhost:3000/auth/discord/callback"
        );

        assertSame(response, result);
        verify(sessionService).registerAuthenticatedSession(
                user,
                "jti-discord",
                expiresAt
        );
    }

    private User user(boolean enabled) {
        User user = new User();
        user.setId(1L);
        user.setName("User");
        user.setEmail("user@example.com");
        user.setAuthProvider("LOCAL");
        user.setEnabled(enabled);
        return user;
    }
}
