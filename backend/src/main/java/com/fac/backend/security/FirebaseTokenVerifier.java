package com.fac.backend.security;

import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Component
public class FirebaseTokenVerifier {

    static final String GOOGLE_JWKS_URI =
            "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

    private final String projectId;
    private final String jwkSetUri;
    private volatile JwtDecoder decoder;

    @Autowired
    public FirebaseTokenVerifier(
            @Value("${firebase.project-id:}") String projectId) {
        this(projectId, GOOGLE_JWKS_URI);
    }

    FirebaseTokenVerifier(String projectId, String jwkSetUri) {
        this.projectId = projectId;
        this.jwkSetUri = jwkSetUri;
    }

    public FirebaseIdentity verify(String idToken) {
        Jwt jwt = decode(idToken);
        Map<String, Object> firebase = firebaseClaim(jwt);
        String provider = stringClaim(firebase, "sign_in_provider");
        String uid = jwt.getSubject();

        if (provider == null || provider.isBlank()
                || uid == null || uid.isBlank()) {
            throw unauthorized();
        }

        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            throw new ApplicationException(
                    ErrorCase.INVALID_OPERATION,
                    "El proveedor no entregó un correo"
            );
        }

        return new FirebaseIdentity(
                provider,
                uid,
                email,
                jwt.getClaimAsString("name"),
                jwt.getClaimAsString("picture")
        );
    }

    private Jwt decode(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw unauthorized();
        }

        try {
            return decoder().decode(idToken);
        } catch (JwtException | IllegalArgumentException exception) {
            throw unauthorized();
        }
    }

    private Map<String, Object> firebaseClaim(Jwt jwt) {
        Object claim = jwt.getClaim("firebase");

        if (claim instanceof Map<?, ?> values) {
            @SuppressWarnings("unchecked")
            Map<String, Object> firebase = (Map<String, Object>) values;
            return firebase;
        }

        throw unauthorized();
    }

    private String stringClaim(Map<String, Object> claims, String name) {
        Object value = claims.get(name);
        return value instanceof String text ? text : null;
    }

    private JwtDecoder decoder() {
        if (projectId == null || projectId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "FIREBASE_PROJECT_ID no está configurado en el backend"
            );
        }

        JwtDecoder current = decoder;
        if (current == null) {
            synchronized (this) {
                current = decoder;
                if (current == null) {
                    current = buildDecoder(projectId);
                    decoder = current;
                }
            }
        }

        return current;
    }

    private JwtDecoder buildDecoder(String firebaseProjectId) {
        NimbusJwtDecoder nimbus = NimbusJwtDecoder
                .withJwkSetUri(jwkSetUri)
                .jwsAlgorithm(SignatureAlgorithm.RS256)
                .build();

        OAuth2TokenValidator<Jwt> defaults =
                JwtValidators.createDefaultWithIssuer(
                        "https://securetoken.google.com/"
                                + firebaseProjectId
                );

        OAuth2TokenValidator<Jwt> audience = token ->
                token.getAudience() != null
                        && token.getAudience().contains(firebaseProjectId)
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(
                                new OAuth2Error(
                                        "invalid_token",
                                        "El token no está dirigido a este "
                                                + "proyecto de Firebase",
                                        null
                                )
                        );

        nimbus.setJwtValidator(
                new DelegatingOAuth2TokenValidator<>(defaults, audience)
        );

        return nimbus;
    }

    private ApplicationException unauthorized() {
        return new ApplicationException(
                ErrorCase.UNAUTHORIZED,
                "Token de Firebase inválido o expirado"
        );
    }
}
