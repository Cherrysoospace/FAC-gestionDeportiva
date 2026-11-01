package com.fac.backend.service;

import com.fac.backend.dto.AuthResponseDTO;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.security.ExternalIdentity;
import com.fac.backend.security.IdentityTokenVerifier;
import com.fac.backend.security.OAuthCodeProviderStrategy;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * HU-SE-08, mecanismo 2: login con proveedores externos.
 * <p>
 * Depende solo de abstracciones (DIP): {@link IdentityTokenVerifier} para
 * Google y GitHub, y {@link OAuthCodeProviderStrategy} para los proveedores
 * por authorization code como Discord. No sabe que existe Firebase.
 * Los usuarios OAuth no pasan por el 2FA interno (HU-SE-10).
 */
@Service
@RequiredArgsConstructor
public class OAuthLoginService {

    private final IdentityTokenVerifier identityTokenVerifier;
    private final List<OAuthCodeProviderStrategy> codeProviders;
    private final OAuthAccountProvisioner accountProvisioner;
    private final AccountStatusPolicy accountStatusPolicy;
    private final SessionIssuer sessionIssuer;

    /** Google y GitHub: el frontend ya inició sesión y envía el ID token. */
    @Transactional
    public AuthResponseDTO loginWithIdToken(String idToken) {
        return startSession(identityTokenVerifier.verify(idToken));
    }

    /** Discord u otro proveedor que entrega un authorization code. */
    @Transactional
    public AuthResponseDTO loginWithAuthorizationCode(
            String provider,
            String code,
            String redirectUri) {

        OAuthCodeProviderStrategy strategy = codeProviders.stream()
                .filter(candidate -> candidate.supports(provider))
                .findFirst()
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.INVALID_OPERATION,
                        "Proveedor de inicio de sesión no soportado: " + provider
                ));

        return startSession(strategy.authenticate(code, redirectUri));
    }

    private AuthResponseDTO startSession(ExternalIdentity identity) {
        User user = accountProvisioner.resolve(identity);
        accountStatusPolicy.ensureEnabled(user);
        return sessionIssuer.issue(user);
    }
}
