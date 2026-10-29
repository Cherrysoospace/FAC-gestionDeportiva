package com.fac.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Envía los correos de verdad por SMTP (Gmail, Outlook, Mailtrap...).
 * Se activa con app.mail.mode=smtp; la conexión se configura con spring.mail.*.
 */
@Service
@ConditionalOnProperty(name = "app.mail.mode", havingValue = "smtp")
public class SmtpMailService implements MailService {

    private static final Logger logger = LoggerFactory.getLogger(SmtpMailService.class);

    private final JavaMailSender mailSender;
    private final String from;

    public SmtpMailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    /**
     * Se ejecuta en segundo plano: la petición HTTP no espera al servidor SMTP
     * y su tiempo de respuesta no revela si el correo existe. Si el envío
     * falla se registra en el log; quien lo pidió no se ve afectado.
     */
    @Async
    @Override
    public void send(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        try {
            mailSender.send(message);
            logger.info("Correo '{}' enviado a {}", subject, to);
        } catch (MailException exception) {
            logger.error("No se pudo enviar el correo '{}' a {}", subject, to, exception);
        }
    }
}
