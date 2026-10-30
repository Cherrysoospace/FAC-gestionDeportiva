package com.fac.backend.service;

import com.fac.backend.config.TwoFactorProperties;
import com.fac.backend.dto.twofactor.TwoFactorChallengeDTO;
import com.fac.backend.entity.TwoFactorChallenge;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.repository.TwoFactorChallengeRepository;
import com.fac.backend.security.OneTimeCodeGenerator;
import com.fac.backend.security.SecureTokenGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TwoFactorServiceTest {

    // Generador real: así se prueban de verdad hash y comparación
    private final SecureTokenGenerator tokenGenerator = new SecureTokenGenerator();
    private final TwoFactorProperties properties = new TwoFactorProperties(6, 5, 3, 30);

    @Mock
    private TwoFactorChallengeRepository challengeRepository;

    @Mock
    private OneTimeCodeGenerator codeGenerator;

    @Mock
    private TwoFactorNotifier notifier;

    private TwoFactorService service;

    @BeforeEach
    void setUp() {
        service = new TwoFactorService(
                challengeRepository,
                tokenGenerator,
                codeGenerator,
                notifier,
                properties
        );
    }

    @Test
    void startChallengeStoresOnlyHashesAndEmailsTheCode() {
        User user = user();
        when(codeGenerator.generate(6)).thenReturn("123456");

        TwoFactorChallengeDTO dto = service.startChallenge(user);

        ArgumentCaptor<TwoFactorChallenge> saved =
                ArgumentCaptor.forClass(TwoFactorChallenge.class);
        verify(challengeRepository).deleteByUserIdAndUsedAtIsNull(user.getId());
        verify(challengeRepository).save(saved.capture());
        verify(notifier).sendCode(user, "123456");

        TwoFactorChallenge challenge = saved.getValue();
        assertNotNull(dto.challengeId());
        assertEquals(tokenGenerator.hash(dto.challengeId()), challenge.getChallengeHash());
        assertNotEquals("123456", challenge.getCodeHash());
        assertEquals("us***@example.com", dto.destination());
    }

    @Test
    void verifyWithCorrectCodeMarksChallengeAsUsed() {
        TwoFactorChallenge challenge = pendingChallenge("challenge-1", "123456");

        User result = service.verify("challenge-1", "123456");

        assertSame(challenge.getUser(), result);
        assertNotNull(challenge.getUsedAt());
    }

    @Test
    void usedCodeCannotBeReused() {
        TwoFactorChallenge challenge = pendingChallenge("challenge-1", "123456");
        challenge.setUsedAt(LocalDateTime.now());

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> service.verify("challenge-1", "123456")
        );

        assertEquals(TwoFactorService.INVALID_CHALLENGE_MESSAGE, exception.getMessage());
    }

    @Test
    void expiredCodeIsRejected() {
        TwoFactorChallenge challenge = pendingChallenge("challenge-1", "123456");
        challenge.setExpiresAt(LocalDateTime.now().minusSeconds(1));

        assertThrows(
                ApplicationException.class,
                () -> service.verify("challenge-1", "123456")
        );
    }

    @Test
    void wrongCodeCountsAttemptsAndLocksTheChallenge() {
        TwoFactorChallenge challenge = pendingChallenge("challenge-1", "123456");

        ApplicationException first = assertThrows(
                ApplicationException.class,
                () -> service.verify("challenge-1", "000000")
        );
        assertEquals(TwoFactorService.INVALID_CODE_MESSAGE, first.getMessage());
        assertEquals(1, challenge.getAttempts());

        assertThrows(ApplicationException.class, () -> service.verify("challenge-1", "000000"));
        ApplicationException last = assertThrows(
                ApplicationException.class,
                () -> service.verify("challenge-1", "000000")
        );

        // Agotados los intentos, ni el código correcto sirve
        assertEquals(TwoFactorService.INVALID_CHALLENGE_MESSAGE, last.getMessage());
        assertThrows(ApplicationException.class, () -> service.verify("challenge-1", "123456"));
    }

    @Test
    void cancelledChallengeDoesNotGrantAccess() {
        TwoFactorChallenge challenge = pendingChallenge("challenge-1", "123456");

        service.cancel("challenge-1");

        assertNotNull(challenge.getCancelledAt());
        assertThrows(ApplicationException.class, () -> service.verify("challenge-1", "123456"));
    }

    @Test
    void resendIsRejectedDuringCooldown() {
        pendingChallenge("challenge-1", "123456");

        assertThrows(ApplicationException.class, () -> service.resend("challenge-1"));
    }

    @Test
    void resendReplacesTheCode() {
        TwoFactorChallenge challenge = pendingChallenge("challenge-1", "123456");
        challenge.setLastSentAt(LocalDateTime.now().minusMinutes(1));
        when(codeGenerator.generate(6)).thenReturn("654321");

        service.resend("challenge-1");

        verify(notifier).sendCode(challenge.getUser(), "654321");
        assertThrows(ApplicationException.class, () -> service.verify("challenge-1", "123456"));
    }

    private TwoFactorChallenge pendingChallenge(String rawChallengeId, String code) {
        TwoFactorChallenge challenge = new TwoFactorChallenge();
        challenge.setChallengeHash(tokenGenerator.hash(rawChallengeId));
        challenge.setCodeHash(tokenGenerator.hash(code));
        challenge.setUser(user());
        challenge.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        challenge.setLastSentAt(LocalDateTime.now());

        when(challengeRepository.findByChallengeHash(tokenGenerator.hash(rawChallengeId)))
                .thenReturn(Optional.of(challenge));
        return challenge;
    }

    private User user() {
        User user = new User();
        user.setId(1L);
        user.setName("User");
        user.setEmail("user@example.com");
        user.setPassword("encoded-password");
        user.setAuthProvider(User.LOCAL_AUTH_PROVIDER);
        user.setTwoFactorEnabled(true);
        return user;
    }
}
