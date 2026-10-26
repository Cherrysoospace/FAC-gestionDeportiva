package com.fac.backend.security;

import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FirebaseTokenVerifierTest {

    private static final String PROJECT_ID = "test-project";
    private static final String ISSUER =
            "https://securetoken.google.com/" + PROJECT_ID;
    private static final String KEY_ID = "test-key";

    private static HttpServer server;
    private static KeyPair keyPair;
    private static KeyPair otherKeyPair;
    private static FirebaseTokenVerifier verifier;

    @BeforeAll
    static void setUp() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        keyPair = generator.generateKeyPair();
        otherKeyPair = generator.generateKeyPair();

        RSAKey publicJwk = new RSAKey.Builder(
                (RSAPublicKey) keyPair.getPublic()
        ).keyID(KEY_ID).build();

        server = HttpServer.create(
                new InetSocketAddress("127.0.0.1", 0),
                0
        );
        server.createContext("/jwks", exchange -> {
            byte[] body = new JWKSet(publicJwk)
                    .toString()
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add(
                    "Content-Type",
                    "application/json"
            );
            exchange.sendResponseHeaders(200, body.length);
            try (var output = exchange.getResponseBody()) {
                output.write(body);
            }
        });
        server.start();

        String jwksUri = "http://127.0.0.1:"
                + server.getAddress().getPort()
                + "/jwks";
        verifier = new FirebaseTokenVerifier(PROJECT_ID, jwksUri);
    }

    @AfterAll
    static void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void verifiesValidGoogleToken() throws Exception {
        FirebaseIdentity identity = verifier.verify(
                token(validClaims(), keyPair)
        );

        assertEquals("google.com", identity.provider());
        assertEquals("firebase-uid", identity.uid());
        assertEquals("user@example.com", identity.email());
        assertEquals("Test User", identity.name());
        assertEquals("https://example.com/photo.png", identity.picture());
    }

    @Test
    void rejectsExpiredToken() throws Exception {
        JWTClaimsSet.Builder claims = validClaims()
                .expirationTime(Date.from(
                        Instant.now().minusSeconds(600)
                ));

        assertUnauthorized(token(claims, keyPair));
    }

    @Test
    void rejectsWrongIssuer() throws Exception {
        JWTClaimsSet.Builder claims = validClaims()
                .issuer("https://securetoken.google.com/other-project");

        assertUnauthorized(token(claims, keyPair));
    }

    @Test
    void rejectsWrongAudience() throws Exception {
        JWTClaimsSet.Builder claims = validClaims()
                .audience("other-project");

        assertUnauthorized(token(claims, keyPair));
    }

    @Test
    void rejectsInvalidSignature() throws Exception {
        assertUnauthorized(token(validClaims(), otherKeyPair));
    }

    @Test
    void rejectsTokenWithoutEmail() throws Exception {
        JWTClaimsSet.Builder claims = validClaims()
                .claim("email", null);

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> verifier.verify(token(claims, keyPair))
        );

        assertEquals(ErrorCase.INVALID_OPERATION, exception.getErrorCase());
    }

    @Test
    void rejectsTokenWithoutFirebaseProvider() throws Exception {
        JWTClaimsSet.Builder claims = validClaims()
                .claim("firebase", Map.of());

        assertUnauthorized(token(claims, keyPair));
    }

    @Test
    void failsClearlyWhenProjectIdIsMissing() {
        FirebaseTokenVerifier unconfigured =
                new FirebaseTokenVerifier("", "http://127.0.0.1/jwks");

        assertThrows(
                ResponseStatusException.class,
                () -> unconfigured.verify("token")
        );
    }

    private void assertUnauthorized(String token) {
        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> verifier.verify(token)
        );

        assertEquals(ErrorCase.UNAUTHORIZED, exception.getErrorCase());
    }

    private JWTClaimsSet.Builder validClaims() {
        Instant now = Instant.now();

        return new JWTClaimsSet.Builder()
                .issuer(ISSUER)
                .subject("firebase-uid")
                .audience(PROJECT_ID)
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(3600)))
                .claim("email", "user@example.com")
                .claim("name", "Test User")
                .claim("picture", "https://example.com/photo.png")
                .claim("firebase", Map.of(
                        "sign_in_provider",
                        "google.com"
                ));
    }

    private String token(
            JWTClaimsSet.Builder claims,
            KeyPair signingKey) throws Exception {

        SignedJWT jwt = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256)
                        .keyID(KEY_ID)
                        .build(),
                claims.build()
        );
        jwt.sign(new RSASSASigner(
                (RSAPrivateKey) signingKey.getPrivate()
        ));

        return jwt.serialize();
    }
}
