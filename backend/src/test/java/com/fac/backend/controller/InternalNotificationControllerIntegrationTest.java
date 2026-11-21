package com.fac.backend.controller;

import com.fac.backend.entity.User;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.service.JwtService;
import com.fac.backend.service.MailService;
import com.fac.backend.service.SessionService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class InternalNotificationControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private SessionService sessionService;

    @MockitoBean
    private MailService mailService;

    @Test
    void sendEmailRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/internal/notifications/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "to": ["ana@uc.edu.co"],
                                  "subject": "Nuevo partido",
                                  "body": "Cuerpo de prueba"
                                }
                                """))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(mailService);
    }

    @Test
    void sendEmailAllowsAnyAuthenticatedUserAndNormalizesRecipients() throws Exception {
        String token = createAuthenticatedToken("notificaciones-internas@uc.edu.co");

        mockMvc.perform(post("/api/internal/notifications/email")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "to": ["Ana@uc.edu.co", "ana@uc.edu.co", "LUIS@uc.edu.co"],
                                  "subject": "  Nuevo partido  ",
                                  "body": "Cuerpo de prueba"
                                }
                                """))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message")
                        .value("Notificación encolada para 2 destinatario(s)"));

        verify(mailService).sendBcc(
                List.of("ana@uc.edu.co", "luis@uc.edu.co"),
                "Nuevo partido",
                "Cuerpo de prueba"
        );
    }

    @Test
    void sendEmailRejectsInvalidPayloads() throws Exception {
        String token = createAuthenticatedToken("notificaciones-validacion@uc.edu.co");

        mockMvc.perform(post("/api/internal/notifications/email")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "to": [],
                                  "subject": "Nuevo partido",
                                  "body": "Cuerpo"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.to").exists());

        mockMvc.perform(post("/api/internal/notifications/email")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "to": ["correo-invalido"],
                                  "subject": "Nuevo partido",
                                  "body": "Cuerpo"
                                }
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/internal/notifications/email")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "to": ["ana@uc.edu.co"],
                                  "subject": "   ",
                                  "body": "Cuerpo"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.subject").exists());

        mockMvc.perform(post("/api/internal/notifications/email")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "to": ["ana@uc.edu.co"],
                                  "subject": "Nuevo partido",
                                  "body": "   "
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.body").exists());

        verifyNoInteractions(mailService);
    }

    private String createAuthenticatedToken(String email) {
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User created = new User();
            created.setName("Usuario Interno");
            created.setEmail(email);
            created.setPassword("not-used");
            created.setEnabled(true);
            return userRepository.save(created);
        });

        JwtService.IssuedToken issued = jwtService.generateToken(user);
        sessionService.registerAuthenticatedSession(
                user,
                issued.jti(),
                issued.expiresAt()
        );
        return issued.response().accessToken();
    }
}
