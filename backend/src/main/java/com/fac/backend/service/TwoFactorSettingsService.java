package com.fac.backend.service;

import com.fac.backend.dto.twofactor.TwoFactorStatusDTO;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.security.AuthProviders;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * HU-SE-10: activar o desactivar el segundo factor desde el perfil propio.
 * Las cuentas OAuth no lo usan: confían en la seguridad de su proveedor.
 */
@Service
@RequiredArgsConstructor
public class TwoFactorSettingsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TwoFactorNotifier notifier;

    @Transactional(readOnly = true)
    public TwoFactorStatusDTO getStatus(Long userId) {
        return toStatus(findUser(userId));
    }

    @Transactional
    public TwoFactorStatusDTO update(Long userId, boolean enabled, String currentPassword) {
        User user = findUser(userId);

        if (!user.hasLocalCredentials()) {
            throw externalProviderAccount(user);
        }

        // 400 y no 401: un 401 haría que el frontend cierre la sesión activa
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new ApplicationException(
                    ErrorCase.INVALID_OPERATION,
                    "La contraseña actual no es correcta"
            );
        }

        if (user.isTwoFactorEnabled() != enabled) {
            user.setTwoFactorEnabled(enabled);
            notifier.sendStatusChanged(user, enabled);
        }

        return toStatus(user);
    }

    private TwoFactorStatusDTO toStatus(User user) {
        return new TwoFactorStatusDTO(
                user.requiresTwoFactor(),
                user.hasLocalCredentials()
        );
    }

    private ApplicationException externalProviderAccount(User user) {
        String provider = AuthProviders.label(user.getAuthProvider());
        String providerName = provider == null ? "un proveedor externo" : provider;

        return new ApplicationException(
                ErrorCase.INVALID_OPERATION,
                "Tu cuenta inicia sesión con " + providerName
                        + ". La verificación adicional la gestiona ese proveedor."
        );
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND,
                        "Usuario no encontrado con id: " + userId
                ));
    }
}
