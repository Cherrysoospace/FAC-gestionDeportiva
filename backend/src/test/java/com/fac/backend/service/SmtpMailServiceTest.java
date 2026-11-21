package com.fac.backend.service;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@ExtendWith(MockitoExtension.class)
class SmtpMailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private SmtpMailService smtpMailService;

    @BeforeEach
    void setUp() {
        smtpMailService = new SmtpMailService(mailSender, "no-reply@fac.local");
    }

    @Test
    void sendBccBuildsSingleMessageWithBccRecipients() {
        smtpMailService.sendBcc(
                List.of("ana@uc.edu.co", "luis@uc.edu.co"),
                "Nuevo partido",
                "Detalle del partido"
        );

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage sent = captor.getValue();
        assertEquals("no-reply@fac.local", sent.getFrom());
        assertArrayEquals(new String[]{"no-reply@fac.local"}, sent.getTo());
        assertArrayEquals(new String[]{"ana@uc.edu.co", "luis@uc.edu.co"}, sent.getBcc());
        assertEquals("Nuevo partido", sent.getSubject());
        assertEquals("Detalle del partido", sent.getText());
    }

    @Test
    void sendBccUsesDirectRecipientWhenOnlyOneRecipient() {
        smtpMailService.sendBcc(
                List.of("ana@uc.edu.co"),
                "Apuesta registrada",
                "Detalle"
        );

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage sent = captor.getValue();
        assertEquals("no-reply@fac.local", sent.getFrom());
        assertArrayEquals(new String[]{"ana@uc.edu.co"}, sent.getTo());
        assertNull(sent.getBcc());
        assertEquals("Apuesta registrada", sent.getSubject());
        assertEquals("Detalle", sent.getText());
    }

    @Test
    void sendBccIgnoresEmptyRecipients() {
        smtpMailService.sendBcc(List.of(), "Asunto", "Cuerpo");
        smtpMailService.sendBcc(null, "Asunto", "Cuerpo");

        verifyNoInteractions(mailSender);
    }

    @Test
    void sendBccSwallowsMailException() {
        doThrow(new MailSendException("SMTP caído"))
                .when(mailSender)
                .send(any(SimpleMailMessage.class));

        assertDoesNotThrow(() ->
                smtpMailService.sendBcc(
                        List.of("ana@uc.edu.co"),
                        "Nuevo partido",
                        "Detalle"
                )
        );
    }
}
