package com.fac.backend.service;

import com.fac.backend.dto.AuthResponseDTO;
import com.fac.backend.dto.LoginRequestDTO;
import com.fac.backend.dto.LoginResponseDTO;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.repository.TwoFactorChallengeRepository;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.security.OneTimeCodeGenerator;
import com.fac.backend.security.SecureTokenGenerator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

/**
 * Flujo completo de HU-SE-10 contra la base H2, con transacciones reales.
 */
@SpringBootTest
class TwoFactorLoginIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TwoFactorChallengeRepository challengeRepository;

    @Autowired
    private SecureTokenGenerator tokenGenerator;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Código fijo para poder escribirlo en la prueba (normalmente llega por correo)
    @MockitoBean
    private OneTimeCodeGenerator codeGenerator;

    @Test
    void loginRequiresCodeAndCodeWorksOnlyOnce() {
        when(codeGenerator.generate(anyInt())).thenReturn("246810");
        User user = localUserWithTwoFactor();

        LoginResponseDTO login = authService.login(loginRequest(user.getEmail()));

        assertTrue(login.twoFactorRequired());
        String challengeId = login.twoFactor().challengeId();

        // Un código incorrecto no da acceso, pero el intento queda registrado
        assertThrows(
                ApplicationException.class,
                () -> authService.completeTwoFactorLogin(challengeId, "000000")
        );
        String challengeHash = tokenGenerator.hash(challengeId);
        assertEquals(1, challengeRepository.findAll().stream()
                .filter(challenge -> challengeHash.equals(challenge.getChallengeHash()))
                .findFirst()
                .orElseThrow()
                .getAttempts());

        AuthResponseDTO session = authService.completeTwoFactorLogin(challengeId, "246810");
        assertNotNull(session.accessToken());
        assertNotNull(session.expiresAt());

        assertThrows(
                ApplicationException.class,
                () -> authService.completeTwoFactorLogin(challengeId, "246810")
        );
    }

    private User localUserWithTwoFactor() {
        User user = new User();
        user.setName("Two Factor");
        user.setEmail("2fa-" + UUID.randomUUID() + "@example.com");
        user.setPassword(passwordEncoder.encode("Secret123!"));
        user.setAuthProvider(User.LOCAL_AUTH_PROVIDER);
        user.setTwoFactorEnabled(true);
        return userRepository.save(user);
    }

    private LoginRequestDTO loginRequest(String email) {
        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail(email);
        dto.setPassword("Secret123!");
        return dto;
    }
}
