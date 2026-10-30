package com.fac.backend.service;

import com.fac.backend.config.TwoFactorProperties;
import com.fac.backend.dto.twofactor.TwoFactorChallengeDTO;
import com.fac.backend.entity.TwoFactorChallenge;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.repository.TwoFactorChallengeRepository;
import com.fac.backend.security.OneTimeCodeGenerator;
import com.fac.backend.security.SecureTokenGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * HU-SE-10: ciclo de vida del segundo factor durante el login.
 * Solo valida el código; emitir la sesión le corresponde a AuthService.
 */
@Service
@RequiredArgsConstructor
public class TwoFactorService {

    static final String INVALID_CODE_MESSAGE =
            "El código de verificación es incorrecto o ya expiró";
    static final String INVALID_CHALLENGE_MESSAGE =
            "La verificación expiró o ya no es válida. Inicia sesión de nuevo.";

    private final TwoFactorChallengeRepository challengeRepository;
    private final SecureTokenGenerator tokenGenerator;
    private final OneTimeCodeGenerator codeGenerator;
    private final TwoFactorNotifier notifier;
    private final TwoFactorProperties properties;

    /**
     * Se llama después de validar correo y contraseña. Un login nuevo anula
     * los retos pendientes anteriores del mismo usuario.
     */
    @Transactional
    public TwoFactorChallengeDTO startChallenge(User user) {
        challengeRepository.deleteByUserIdAndUsedAtIsNull(user.getId());

        String rawChallengeId = tokenGenerator.generate();
        TwoFactorChallenge challenge = new TwoFactorChallenge();
        challenge.setChallengeHash(tokenGenerator.hash(rawChallengeId));
        challenge.setUser(user);
        sendNewCode(challenge, LocalDateTime.now());
        challengeRepository.save(challenge);

        return toDTO(rawChallengeId, challenge);
    }

    /**
     * Devuelve el usuario si el código es correcto y lo marca como usado.
     * Los intentos fallidos se guardan aunque se lance la excepción.
     */
    @Transactional(noRollbackFor = ApplicationException.class)
    public User verify(String rawChallengeId, String code) {
        LocalDateTime now = LocalDateTime.now();
        TwoFactorChallenge challenge = findUsableChallenge(rawChallengeId, now);

        if (!tokenGenerator.matches(code, challenge.getCodeHash())) {
            challenge.registerFailedAttempt();
            throw challenge.isUsable(now, properties.maxAttempts())
                    ? invalidCode()
                    : invalidChallenge();
        }

        challenge.setUsedAt(now);
        return challenge.getUser();
    }

    @Transactional
    public TwoFactorChallengeDTO resend(String rawChallengeId) {
        LocalDateTime now = LocalDateTime.now();
        TwoFactorChallenge challenge = findUsableChallenge(rawChallengeId, now);

        if (resendAvailableAt(challenge).isAfter(now)) {
            throw new ApplicationException(
                    ErrorCase.INVALID_OPERATION,
                    "Espera unos segundos antes de pedir otro código"
            );
        }

        sendNewCode(challenge, now);
        return toDTO(rawChallengeId, challenge);
    }

    /** El usuario abandonó la verificación: el reto ya no sirve para entrar. */
    @Transactional
    public void cancel(String rawChallengeId) {
        challengeRepository.findByChallengeHash(tokenGenerator.hash(rawChallengeId))
                .filter(challenge -> !challenge.isUsed() && !challenge.isCancelled())
                .ifPresent(challenge -> challenge.setCancelledAt(LocalDateTime.now()));
    }

    // Cada envío reemplaza el código anterior y reinicia vigencia e intentos
    private void sendNewCode(TwoFactorChallenge challenge, LocalDateTime now) {
        String code = codeGenerator.generate(properties.codeLength());
        challenge.setCodeHash(tokenGenerator.hash(code));
        challenge.setExpiresAt(now.plusMinutes(properties.expirationMinutes()));
        challenge.setLastSentAt(now);
        challenge.setAttempts(0);

        notifier.sendCode(challenge.getUser(), code);
    }

    private TwoFactorChallenge findUsableChallenge(String rawChallengeId, LocalDateTime now) {
        if (rawChallengeId == null || rawChallengeId.isBlank()) {
            throw invalidChallenge();
        }

        return challengeRepository.findByChallengeHash(tokenGenerator.hash(rawChallengeId))
                .filter(challenge -> challenge.isUsable(now, properties.maxAttempts()))
                .filter(challenge -> challenge.getUser().requiresTwoFactor())
                .orElseThrow(this::invalidChallenge);
    }

    private LocalDateTime resendAvailableAt(TwoFactorChallenge challenge) {
        return challenge.getLastSentAt().plusSeconds(properties.resendCooldownSeconds());
    }

    private TwoFactorChallengeDTO toDTO(String rawChallengeId, TwoFactorChallenge challenge) {
        return new TwoFactorChallengeDTO(
                rawChallengeId,
                toInstant(challenge.getExpiresAt()),
                toInstant(resendAvailableAt(challenge)),
                maskEmail(challenge.getUser().getEmail())
        );
    }

    private Instant toInstant(LocalDateTime dateTime) {
        return dateTime.atZone(ZoneId.systemDefault()).toInstant();
    }

    // usuario@ejemplo.com -> us***@ejemplo.com
    static String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 0) {
            return "***";
        }
        String visible = email.substring(0, Math.min(2, at));
        return visible + "***" + email.substring(at);
    }

    private ApplicationException invalidCode() {
        return new ApplicationException(ErrorCase.INVALID_OPERATION, INVALID_CODE_MESSAGE);
    }

    private ApplicationException invalidChallenge() {
        return new ApplicationException(ErrorCase.INVALID_OPERATION, INVALID_CHALLENGE_MESSAGE);
    }
}
