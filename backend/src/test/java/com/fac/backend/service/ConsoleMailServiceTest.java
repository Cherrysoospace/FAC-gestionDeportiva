package com.fac.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

@ExtendWith(OutputCaptureExtension.class)
class ConsoleMailServiceTest {

    @Test
    void sendWritesTheEmailToTheLog(CapturedOutput output) {
        MailService mailService = new ConsoleMailService("no-reply@fac.local");

        mailService.send(
                "juan@uc.edu.co",
                "Recuperar contraseña",
                "Enlace: http://localhost:3000/auth/reset-password?token=abc123"
        );

        assertThat(output)
                .contains("[CORREO SIMULADO]")
                .contains("Para: juan@uc.edu.co")
                .contains("Asunto: Recuperar contraseña")
                .contains("token=abc123");
    }

    @Test
    void sendBccWritesAllRecipientsToTheLog(CapturedOutput output) {
        MailService mailService = new ConsoleMailService("no-reply@fac.local");

        mailService.sendBcc(
                List.of("ana@uc.edu.co", "luis@uc.edu.co"),
                "Nuevo partido",
                "Se programó Nacional vs Millonarios"
        );

        assertThat(output)
                .contains("[CORREO SIMULADO (BCC)]")
                .contains("CCO: ana@uc.edu.co, luis@uc.edu.co")
                .contains("Asunto: Nuevo partido")
                .contains("Se programó Nacional vs Millonarios");
    }
}
