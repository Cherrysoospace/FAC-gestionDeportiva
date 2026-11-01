package com.fac.backend.security;

import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

import java.util.List;
import java.util.Map;

/**
 * Implementación de {@link IdentityTokenVerifier} para Google y GitHub:
 * ambos inician sesión en Firebase y llegan aquí como un ID token firmado.
 * Es un detalle de infraestructura; los servicios solo conocen la interfaz.
 */
@Component
public class FirebaseTokenVerifier implements IdentityTokenVerifier {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseTokenVerifier.class);

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

    @Override
    public ExternalIdentity verify(String idToken) {
        Jwt jwt = decode(idToken);
        Map<String, Object> firebase = firebaseClaim(jwt);
        FirebaseSignInProvider provider = FirebaseSignInProvider
                .from(stringClaim(firebase, "sign_in_provider"))
                .orElseThrow(this::unauthorized);
        String uid = jwt.getSubject();

        if (uid == null || uid.isBlank()) {
            throw unauthorized();
        }

        String email = resolveEmail(jwt, firebase);
        if (email == null) {
            // Solo nombres de claims, nunca valores: sirve para diagnosticar sin exponer datos
            logger.warn(
                    "Token de Firebase sin correo. Proveedor: {}. Claims: {}. firebase.identities: {}",
                    provider.signInProvider(),
                    jwt.getClaims().keySet(),
                    identities(firebase).keySet()
            );
            throw new ApplicationException(
                    ErrorCase.INVALID_OPERATION,
                    missingEmailMessage(provider)
            );
        }

        // GitHub suele llegar con email_verified=false aunque el correo sea
        // legítimo, por eso la verificación solo se exige donde es confiable
        if (provider.requiresVerifiedEmail()
                && !Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified"))) {
            throw new ApplicationException(
                    ErrorCase.UNAUTHORIZED,
                    "El correo de la cuenta no está verificado por el proveedor"
            );
        }

        return new ExternalIdentity(
                provider.signInProvider(),
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

    /**
     * El correo suele venir en el claim "email". Si la cuenta de Firebase no
     * lo tiene guardado (por ejemplo, se creó antes de pedir el scope
     * user:email en GitHub), Firebase aún puede incluirlo en
     * firebase.identities.email, que también está firmado por Google.
     */
    private String resolveEmail(Jwt jwt, Map<String, Object> firebase) {
        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) {
            return email.trim();
        }

        Object emails = identities(firebase).get("email");
        if (emails instanceof List<?> values) {
            return values.stream()
                    .filter(String.class::isInstance)
                    .map(value -> ((String) value).trim())
                    .filter(value -> !value.isBlank())
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }

    private Map<?, ?> identities(Map<String, Object> firebase) {
        Object identities = firebase.get("identities");
        return identities instanceof Map<?, ?> values ? values : Map.of();
    }

    private String missingEmailMessage(FirebaseSignInProvider provider) {
        if (provider == FirebaseSignInProvider.GITHUB) {
            return "Tu cuenta de GitHub no compartió un correo. Agrega un correo "
                    + "verificado en GitHub (Settings → Emails) e inténtalo de nuevo.";
        }
        return "El proveedor no entregó un correo";
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
