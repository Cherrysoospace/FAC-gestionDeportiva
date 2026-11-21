package com.fac.backend.service;

import java.util.List;

/**
 * Envío de correos de la plataforma (recuperación de contraseña, código 2FA y
 * notificaciones delegadas desde otros microservicios).
 * Quien lo usa no sabe si el correo sale por SMTP o se simula en consola.
 */
public interface MailService {

    void send(String to, String subject, String body);

    default void sendBcc(List<String> recipients, String subject, String body) {
        if (recipients == null || recipients.isEmpty()) {
            return;
        }
        for (String recipient : recipients) {
            send(recipient, subject, body);
        }
    }
}
