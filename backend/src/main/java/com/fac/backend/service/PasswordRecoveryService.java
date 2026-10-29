package com.fac.backend.service;

import com.fac.backend.config.PasswordResetProperties;
import com.fac.backend.entity.PasswordResetToken;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.repository.PasswordResetTokenRepository;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.security.SecureTokenGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

/**
 * HU-SE-09: recuperación de contraseña para cuentas con correo y contraseña.
 */
@Service
@RequiredArgsConstructor
public class PasswordRecoveryService {

    static final String INVALID_TOKEN_MESSAGE =
            "El enlace de recuperación no es válido o ya expiró";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final SecureTokenGenerator tokenGenerator;
    private final PasswordRecoveryNotifier notifier;
    private final PasswordEncoder passwordEncoder;
    private final SessionService sessionService;
    private final PasswordResetProperties properties;

    /**
     * No revela si el correo existe: el controlador responde lo mismo siempre.
     * Las cuentas OAuth reciben un aviso para recuperar con su proveedor.
     */
    @Transactional
    public void requestReset(String email) {
        userRepository.findByEmailIgnoreCase(normalize(email))
                .filter(User::isEnabled)
                .ifPresent(this::startRecovery);
    }

    @Transactional(readOnly = true)
    public void validateToken(String rawToken) {
        findUsableToken(rawToken, LocalDateTime.now());
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        LocalDateTime now = LocalDateTime.now();
        PasswordResetToken token = findUsableToken(rawToken, now);
        User user = token.getUser();

        user.setPassword(passwordEncoder.encode(newPassword));
        token.setUsedAt(now);

        tokenRepository.deleteByUserIdAndUsedAtIsNull(user.getId());
        sessionService.invalidateSessions(user.getId());
        notifier.sendPasswordChangedNotice(user);
    }

    private void startRecovery(User user) {
        if (!hasLocalCredentials(user)) {
            notifier.sendExternalProviderNotice(user);
            return;
        }

        tokenRepository.deleteByUserIdAndUsedAtIsNull(user.getId());

        String rawToken = tokenGenerator.generate();
        PasswordResetToken token = new PasswordResetToken();
        token.setTokenHash(tokenGenerator.hash(rawToken));
        token.setUser(user);
        token.setExpiresAt(
                LocalDateTime.now().plusMinutes(properties.expirationMinutes())
        );
        tokenRepository.save(token);

        notifier.sendResetLink(user, rawToken);
    }

    private PasswordResetToken findUsableToken(String rawToken, LocalDateTime now) {
        if (rawToken == null || rawToken.isBlank()) {
            throw invalidToken();
        }

        return tokenRepository.findByTokenHash(tokenGenerator.hash(rawToken))
                .filter(token -> token.isUsable(now))
                .filter(token -> token.getUser().isEnabled())
                .filter(token -> hasLocalCredentials(token.getUser()))
                .orElseThrow(this::invalidToken);
    }

    private boolean hasLocalCredentials(User user) {
        return User.LOCAL_AUTH_PROVIDER.equals(user.getAuthProvider())
                && user.getPassword() != null
                && !user.getPassword().isBlank();
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private ApplicationException invalidToken() {
        return new ApplicationException(
                ErrorCase.INVALID_OPERATION,
                INVALID_TOKEN_MESSAGE
        );
    }
}
