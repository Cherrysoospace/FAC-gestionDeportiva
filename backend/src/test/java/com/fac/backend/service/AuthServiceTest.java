package com.fac.backend.service;

import com.fac.backend.dto.AuthResponseDTO;
import com.fac.backend.dto.LoginRequestDTO;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.security.FirebaseIdentity;
import com.fac.backend.security.FirebaseTokenVerifier;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private SessionService sessionService;

    @Mock
    private UserService userService;

    @Mock
    private FirebaseTokenVerifier firebaseTokenVerifier;

    @InjectMocks
    private AuthService authService;

    @Test
    void loginIssuesAndPersistsSession() {
        User user = user(true);
        user.setPassword("encoded-password");

        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail(user.getEmail());
        dto.setPassword("secret");

        when(userRepository.findByEmailIgnoreCase(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "encoded-password"))
                .thenReturn(true);

        Instant expiresAt = Instant.now().plusSeconds(900);
        AuthResponseDTO response = new AuthResponseDTO(
                "jwt-token",
                "Bearer",
                expiresAt
        );
        when(jwtService.generateToken(user)).thenReturn(
                new JwtService.IssuedToken(response, "jti-1", expiresAt)
        );

        AuthResponseDTO result = authService.login(dto);

        assertSame(response, result);
        verify(sessionService).registerAuthenticatedSession(
                user,
                "jti-1",
                expiresAt
        );
    }

    @Test
    void loginRejectsUserWithoutPassword() {
        User user = user(true);
        user.setPassword(null);

        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail(user.getEmail());
        dto.setPassword("secret");

        when(userRepository.findByEmailIgnoreCase(user.getEmail()))
                .thenReturn(Optional.of(user));

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> authService.login(dto)
        );

        assertEquals(ErrorCase.UNAUTHORIZED, exception.getErrorCase());
        verify(jwtService, never()).generateToken(user);
        verifyNoInteractions(sessionService);
    }

    @Test
    void loginRejectsDisabledUser() {
        User user = user(false);
        user.setPassword("encoded-password");

        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail(user.getEmail());
        dto.setPassword("secret");

        when(userRepository.findByEmailIgnoreCase(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "encoded-password"))
                .thenReturn(true);

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> authService.login(dto)
        );

        assertEquals(ErrorCase.FORBIDDEN, exception.getErrorCase());
    }

    @Test
    void firebaseLoginResolvesUserAndIssuesSession() {
        FirebaseIdentity identity = new FirebaseIdentity(
                "google.com",
                "uid-1",
                "google@example.com",
                "Google User",
                null
        );
        User user = user(true);

        when(firebaseTokenVerifier.verify("id-token"))
                .thenReturn(identity);
        when(userService.resolverUsuario(
                "google.com",
                "uid-1",
                "google@example.com",
                "Google User",
                null
        )).thenReturn(user);

        Instant expiresAt = Instant.now().plusSeconds(900);
        AuthResponseDTO response = new AuthResponseDTO(
                "jwt-token",
                "Bearer",
                expiresAt
        );
        when(jwtService.generateToken(user)).thenReturn(
                new JwtService.IssuedToken(response, "jti-2", expiresAt)
        );

        AuthResponseDTO result = authService.loginWithFirebase("id-token");

        assertSame(response, result);
        verify(sessionService).registerAuthenticatedSession(
                user,
                "jti-2",
                expiresAt
        );
    }

    @Test
    void firebaseLoginRejectsDisabledUser() {
        FirebaseIdentity identity = new FirebaseIdentity(
                "google.com",
                "uid-2",
                "disabled@example.com",
                "Disabled",
                null
        );
        User user = user(false);

        when(firebaseTokenVerifier.verify("id-token"))
                .thenReturn(identity);
        when(userService.resolverUsuario(
                "google.com",
                "uid-2",
                "disabled@example.com",
                "Disabled",
                null
        )).thenReturn(user);

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> authService.loginWithFirebase("id-token")
        );

        assertEquals(ErrorCase.FORBIDDEN, exception.getErrorCase());
        verify(jwtService, never()).generateToken(user);
    }

    private User user(boolean enabled) {
        User user = new User();
        user.setId(1L);
        user.setName("User");
        user.setEmail("user@example.com");
        user.setAuthProvider("LOCAL");
        user.setEnabled(enabled);
        return user;
    }
}
