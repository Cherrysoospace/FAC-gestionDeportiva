package com.fac.backend.service;

import com.fac.backend.config.PasswordResetProperties;
import com.fac.backend.entity.User;
import com.fac.backend.security.AuthProviders;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Redacta y envía los correos de la recuperación de contraseña.
 * Separado del servicio para que las reglas de negocio no dependan del texto.
 */
@Component
@RequiredArgsConstructor
public class PasswordRecoveryNotifier {

    private final MailService mailService;
    private final PasswordResetProperties properties;

    public void sendResetLink(User user, String rawToken) {
        String link = UriComponentsBuilder.fromUriString(properties.resetUrl())
                .queryParam("token", rawToken)
                .toUriString();

        mailService.send(
                user.getEmail(),
                "Recupera tu contraseña",
                "Hola " + user.getName() + ",\n\n"
                        + "Recibimos una solicitud para restablecer tu contraseña.\n"
                        + "Abre este enlace para crear una nueva:\n\n"
                        + link + "\n\n"
                        + "El enlace vence en " + properties.expirationMinutes()
                        + " minutos y solo se puede usar una vez.\n"
                        + "Si no fuiste tú, ignora este correo."
        );
    }

    public void sendExternalProviderNotice(User user) {
        String provider = AuthProviders.label(user.getAuthProvider());
        String providerName = provider == null ? "tu proveedor externo" : provider;

        mailService.send(
                user.getEmail(),
                "Recuperación de contraseña",
                "Hola " + user.getName() + ",\n\n"
                        + "Tu cuenta inicia sesión con " + providerName
                        + ", así que no tiene una contraseña en esta plataforma.\n"
                        + "Si no puedes entrar, recupera el acceso directamente con "
                        + providerName + "."
        );
    }

    public void sendPasswordChangedNotice(User user) {
        mailService.send(
                user.getEmail(),
                "Tu contraseña fue cambiada",
                "Hola " + user.getName() + ",\n\n"
                        + "Tu contraseña se cambió correctamente y se cerraron "
                        + "todas tus sesiones abiertas.\n"
                        + "Si no fuiste tú, contacta al administrador."
        );
    }
}
