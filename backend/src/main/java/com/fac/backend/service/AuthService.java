package com.fac.backend.service;

import com.fac.backend.dto.AuthResponseDTO;
import com.fac.backend.dto.LoginRequestDTO;
import com.fac.backend.dto.LoginResponseDTO;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.security.AuthProviders;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Login con correo y contraseña (HU-SE-08), incluido el segundo factor
 * (HU-SE-10). El registro, el login social y el usuario actual viven en
 * RegistrationService, OAuthLoginService y CurrentUserService.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TwoFactorService twoFactorService;
    private final SessionIssuer sessionIssuer;
    private final AccountStatusPolicy accountStatusPolicy;

    /**
     * Con 2FA activo no se emite token todavía: se devuelve el reto y la
     * sesión solo se crea en {@link #completeTwoFactorLogin} (HU-SE-10).
     */
    @Transactional
    public LoginResponseDTO login(LoginRequestDTO dto) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(dto.getEmail()))
                .orElseThrow(this::unauthorized);

        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw passwordlessAccount(user);
        }

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw unauthorized();
        }

        accountStatusPolicy.ensureEnabled(user);

        if (user.requiresTwoFactor()) {
            return LoginResponseDTO.twoFactorRequired(
                    twoFactorService.startChallenge(user)
            );
        }

        return LoginResponseDTO.authenticated(sessionIssuer.issue(user));
    }

    // Los intentos fallidos del código deben guardarse aunque se lance el error
    @Transactional(noRollbackFor = ApplicationException.class)
    public AuthResponseDTO completeTwoFactorLogin(String challengeId, String code) {
        User user = twoFactorService.verify(challengeId, code);

        accountStatusPolicy.ensureEnabled(user);

        return sessionIssuer.issue(user);
    }

    // Cuentas creadas con un proveedor externo: se indica con cuál entrar
    private ApplicationException passwordlessAccount(User user) {
        String method = AuthProviders.label(user.getAuthProvider());

        if (method == null
                || User.LOCAL_AUTH_PROVIDER.equals(user.getAuthProvider())) {
            return unauthorized();
        }

        return new ApplicationException(
                ErrorCase.UNAUTHORIZED,
                "Esta cuenta usa " + method + ". Inicia sesión con "
                        + method + "."
        );
    }

    private ApplicationException unauthorized() {
        return new ApplicationException(
                ErrorCase.UNAUTHORIZED,
                "Credenciales incorrectas"
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
