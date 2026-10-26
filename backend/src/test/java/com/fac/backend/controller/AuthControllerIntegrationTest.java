package com.fac.backend.controller;

import com.fac.backend.dto.AuthResponseDTO;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.service.AuthService;
import com.fac.backend.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @MockitoBean
    private AuthService authService;

    @Test
    void oauthEndpointIsPublic() throws Exception {
        AuthResponseDTO response = response();

        when(authService.loginWithFirebase("valid-token"))
                .thenReturn(response);

        mockMvc.perform(post("/api/auth/oauth/firebase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"valid-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("jwt-token"));
    }

    @Test
    void oauthEndpointReturns401ForInvalidToken() throws Exception {
        when(authService.loginWithFirebase("invalid-token"))
                .thenThrow(new ApplicationException(
                        ErrorCase.UNAUTHORIZED,
                        "Token de Firebase inválido o expirado"
                ));

        mockMvc.perform(post("/api/auth/oauth/firebase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"invalid-token\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCase").value("UNAUTHORIZED"));
    }

    @Test
    void oauthEndpointReturns403ForDisabledUser() throws Exception {
        when(authService.loginWithFirebase("disabled-token"))
                .thenThrow(new ApplicationException(
                        ErrorCase.FORBIDDEN,
                        "Tu usuario está deshabilitado"
                ));

        mockMvc.perform(post("/api/auth/oauth/firebase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"disabled-token\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCase").value("FORBIDDEN"));
    }

    @Test
    void oauthEndpointReturns409ForEmailConflict() throws Exception {
        when(authService.loginWithFirebase("conflict-token"))
                .thenThrow(new ApplicationException(
                        ErrorCase.ALREADY_EXISTS,
                        "Ese correo ya está registrado con otro método de acceso"
                ));

        mockMvc.perform(post("/api/auth/oauth/firebase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"conflict-token\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCase").value("ALREADY_EXISTS"));
    }

    @Test
    void oauthEndpointReturns400WhenProviderHasNoEmail() throws Exception {
        when(authService.loginWithFirebase("no-email-token"))
                .thenThrow(new ApplicationException(
                        ErrorCase.INVALID_OPERATION,
                        "El proveedor no entregó un correo"
                ));

        mockMvc.perform(post("/api/auth/oauth/firebase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"no-email-token\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCase").value("INVALID_OPERATION"));
    }

    @Test
    void oauthEndpointRejectsBlankIdToken() throws Exception {
        mockMvc.perform(post("/api/auth/oauth/firebase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.idToken").exists());
    }

    @Test
    void corsPreflightFromFrontendIsAllowed() throws Exception {
        mockMvc.perform(options("/api/auth/oauth/firebase")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST")
                        .header(
                                "Access-Control-Request-Headers",
                                "content-type"
                        ))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        "Access-Control-Allow-Origin",
                        "http://localhost:3000"
                ));
    }

    @Test
    void localLoginEndpointStillWorks() throws Exception {
        when(authService.login(any())).thenReturn(response());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "admin@uc.edu.co",
                                  "password": "Admin123!"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("jwt-token"));
    }

    @Test
    void protectedEndpointStillRejectsAnonymousUsers() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void ownHs256JwtIsStillAcceptedByProtectedEndpoint() throws Exception {
        User admin = userRepository.findByEmail("admin@uc.edu.co")
                .orElseThrow();

        String token = jwtService.generateToken(admin)
                .response()
                .accessToken();

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    private AuthResponseDTO response() {
        return new AuthResponseDTO(
                "jwt-token",
                "Bearer",
                Instant.now().plusSeconds(900)
        );
    }
}
