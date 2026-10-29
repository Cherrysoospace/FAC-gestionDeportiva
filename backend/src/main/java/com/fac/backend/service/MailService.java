package com.fac.backend.service;

/**
 * Envío de correos de la plataforma (recuperación de contraseña, código 2FA).
 * Quien lo usa no sabe si el correo sale por SMTP o se simula en consola.
 */
public interface MailService {

    void send(String to, String subject, String body);
}
