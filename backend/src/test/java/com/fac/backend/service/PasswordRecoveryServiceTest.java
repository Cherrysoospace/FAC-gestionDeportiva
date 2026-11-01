package com.fac.backend.service;

import com.fac.backend.config.PasswordResetProperties;
import com.fac.backend.entity.PasswordResetToken;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.repository.PasswordResetTokenRepository;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.security.SecureTokenGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordRecoveryServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private SecureTokenGenerator tokenGenerator;

    @Mock
    private PasswordRecoveryNotifier notifier;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private SessionService sessionService;

    private PasswordRecoveryService service;

    @BeforeEach
    void setUp() {
        service = new PasswordRecoveryService(
                userRepository,
                tokenRepository,
                tokenGenerator,
                notifier,
                passwordEncoder,
                sessionService,
                new PasswordResetProperties(30, "http://localhost:3000/auth/reset-password")
        );
    }

    @Test
    void requestResetCreatesTokenAndSendsLinkForLocalUser() {
        User user = localUser();
        when(userRepository.findByEmailIgnoreCase("ana@uc.edu.co"))
                .thenReturn(Optional.of(user));
        when(tokenGenerator.generate()).thenReturn("raw-token");
        when(tokenGenerator.hash("raw-token")).thenReturn("hashed-token");

        service.requestReset("  Ana@UC.edu.co ");

        ArgumentCaptor<PasswordResetToken> saved =
                ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).deleteByUserIdAndUsedAtIsNull(7L);
        verify(tokenRepository).save(saved.capture());
        assertEquals("hashed-token", saved.getValue().getTokenHash());
        assertTrue(saved.getValue().getExpiresAt().isAfter(LocalDateTime.now().plusMinutes(29)));
        verify(notifier).sendResetLink(user, "raw-token");
    }

    @Test
    void requestResetForOauthUserOnlySendsProviderNotice() {
        User user = localUser();
        user.setAuthProvider("google.com");
        user.setPassword(null);
        when(userRepository.findByEmailIgnoreCase("ana@uc.edu.co"))
                .thenReturn(Optional.of(user));

        service.requestReset("ana@uc.edu.co");

        verify(notifier).sendExternalProviderNotice(user);
        verify(tokenRepository, never()).save(any());
    }

    @Test
    void requestResetForUnknownOrDisabledUserDoesNothing() {
        User disabled = localUser();
        disabled.setEnabled(false);
        when(userRepository.findByEmailIgnoreCase("ana@uc.edu.co"))
                .thenReturn(Optional.of(disabled));
        when(userRepository.findByEmailIgnoreCase("nadie@uc.edu.co"))
                .thenReturn(Optional.empty());

        service.requestReset("ana@uc.edu.co");
        service.requestReset("nadie@uc.edu.co");

        verifyNoInteractions(notifier, tokenRepository);
    }

    @Test
    void resetPasswordChangesPasswordMarksTokenUsedAndClosesSessions() {
        User user = localUser();
        PasswordResetToken token = token(user, LocalDateTime.now().plusMinutes(10));
        when(tokenGenerator.hash("raw-token")).thenReturn("hashed-token");
        when(tokenRepository.findByTokenHash("hashed-token"))
                .thenReturn(Optional.of(token));
        when(passwordEncoder.encode("Nueva123!")).thenReturn("encoded-new");

        service.resetPassword("raw-token", "Nueva123!");

        assertEquals("encoded-new", user.getPassword());
        assertNotNull(token.getUsedAt());
        verify(sessionService).invalidateSessions(7L);
        verify(notifier).sendPasswordChangedNotice(user);
    }

    @Test
    void resetPasswordRejectsExpiredToken() {
        PasswordResetToken token = token(localUser(), LocalDateTime.now().minusMinutes(1));
        when(tokenGenerator.hash("raw-token")).thenReturn("hashed-token");
        when(tokenRepository.findByTokenHash("hashed-token"))
                .thenReturn(Optional.of(token));

        assertInvalidToken(() -> service.resetPassword("raw-token", "Nueva123!"));
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void resetPasswordRejectsAlreadyUsedToken() {
        PasswordResetToken token = token(localUser(), LocalDateTime.now().plusMinutes(10));
        token.setUsedAt(LocalDateTime.now().minusMinutes(1));
        when(tokenGenerator.hash("raw-token")).thenReturn("hashed-token");
        when(tokenRepository.findByTokenHash("hashed-token"))
                .thenReturn(Optional.of(token));

        assertInvalidToken(() -> service.resetPassword("raw-token", "Nueva123!"));
    }

    @Test
    void validateTokenRejectsUnknownOrBlankToken() {
        when(tokenGenerator.hash("desconocido")).thenReturn("hash-desconocido");
        when(tokenRepository.findByTokenHash("hash-desconocido"))
                .thenReturn(Optional.empty());

        assertInvalidToken(() -> service.validateToken("desconocido"));
        assertInvalidToken(() -> service.validateToken(" "));
    }

    private void assertInvalidToken(Runnable action) {
        ApplicationException exception = assertThrows(
                ApplicationException.class,
                action::run
        );
        assertEquals(ErrorCase.INVALID_OPERATION, exception.getErrorCase());
        assertEquals(PasswordRecoveryService.INVALID_TOKEN_MESSAGE, exception.getMessage());
    }

    private User localUser() {
        User user = new User();
        user.setId(7L);
        user.setName("Ana");
        user.setEmail("ana@uc.edu.co");
        user.setPassword("encoded-old");
        user.setAuthProvider(User.LOCAL_AUTH_PROVIDER);
        user.setEnabled(true);
        return user;
    }

    private PasswordResetToken token(User user, LocalDateTime expiresAt) {
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setTokenHash("hashed-token");
        token.setExpiresAt(expiresAt);
        return token;
    }
}
