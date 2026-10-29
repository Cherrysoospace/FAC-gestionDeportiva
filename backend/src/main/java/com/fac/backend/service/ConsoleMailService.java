package com.fac.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Simula el envío escribiendo el correo en el log del backend.
 * Se activa con app.mail.mode=console (valor por defecto).
 */
@Service
@ConditionalOnProperty(
        name = "app.mail.mode",
        havingValue = "console",
        matchIfMissing = true
)
public class ConsoleMailService implements MailService {

    private static final Logger logger = LoggerFactory.getLogger(ConsoleMailService.class);

    private final String from;

    public ConsoleMailService(@Value("${app.mail.from:no-reply@fac.local}") String from) {
        this.from = from;
    }

    @Override
    public void send(String to, String subject, String body) {
        logger.info(
                "\n========== [CORREO SIMULADO] ==========\n"
                        + "De: {}\n"
                        + "Para: {}\n"
                        + "Asunto: {}\n"
                        + "---------------------------------------\n"
                        + "{}\n"
                        + "=======================================",
                from,
                to,
                subject,
                body
        );
    }
}
