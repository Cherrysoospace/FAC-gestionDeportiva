package com.fac.backend.controller;

import com.fac.backend.entity.User;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.service.MailService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Flujo completo de HU-SE-09 contra la base H2: solicitar, validar,
 * restablecer, reutilizar el enlace e iniciar sesión con la nueva contraseña.
 */
@SpringBootTest
@AutoConfigureMockMvc
class PasswordRecoveryControllerIntegrationTest {

    private static final Pattern TOKEN_IN_LINK = Pattern.compile("token=([A-Za-z0-9_-]+)");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private MailService mailService;

    @Test
    void fullRecoveryFlow() throws Exception {
        createLocalUser("recupera@uc.edu.co", "Vieja123!");

        mockMvc.perform(post("/api/auth/password/forgot")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"recupera@uc.edu.co\"}"))
                .andExpect(status().isAccepted());

        String token = tokenSentTo("recupera@uc.edu.co");

        mockMvc.perform(get("/api/auth/password/reset/validate").param("token", token))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/auth/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resetBody(token, "Nueva123!")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resetBody(token, "Otra1234!")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCase").value("INVALID_OPERATION"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"recupera@uc.edu.co\",\"password\":\"Nueva123!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"recupera@uc.edu.co\",\"password\":\"Vieja123!\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void forgotAnswersTheSameForUnknownEmail() throws Exception {
        mockMvc.perform(post("/api/auth/password/forgot")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nadie@uc.edu.co\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message").isNotEmpty());

        verify(mailService, never()).send(eq("nadie@uc.edu.co"), anyString(), anyString());
    }

    @Test
    void resetRejectsWeakPassword() throws Exception {
        mockMvc.perform(post("/api/auth/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resetBody("cualquiera", "debil")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.newPassword").isNotEmpty());
    }

    @Test
    void validateRejectsUnknownToken() throws Exception {
        mockMvc.perform(get("/api/auth/password/reset/validate").param("token", "no-existe"))
                .andExpect(status().isBadRequest());
    }

    private void createLocalUser(String email, String password) {
        User user = new User();
        user.setName("Recupera");
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setAuthProvider(User.LOCAL_AUTH_PROVIDER);
        user.setEnabled(true);
        userRepository.save(user);
    }

    private String tokenSentTo(String email) {
        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(mailService).send(eq(email), eq("Recupera tu contraseña"), body.capture());

        Matcher matcher = TOKEN_IN_LINK.matcher(body.getValue());
        assertTrue(matcher.find(), "El correo debe incluir el enlace con el token");
        return matcher.group(1);
    }

    private String resetBody(String token, String newPassword) {
        return "{\"token\":\"" + token + "\",\"newPassword\":\"" + newPassword + "\"}";
    }
}
