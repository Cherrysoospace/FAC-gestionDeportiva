package com.fac.backend.service;

import com.fac.backend.config.TwoFactorProperties;
import com.fac.backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Redacta y envía los correos del segundo factor (HU-SE-10).
 * Separado del servicio para que las reglas de negocio no dependan del texto.
 */
@Component
@RequiredArgsConstructor
public class TwoFactorNotifier {

    private final MailService mailService;
    private final TwoFactorProperties properties;

    public void sendCode(User user, String code) {
        mailService.send(
                user.getEmail(),
                "Tu código de verificación",
                "Hola " + user.getName() + ",\n\n"
                        + "Tu código para completar el inicio de sesión es:\n\n"
                        + "    " + code + "\n\n"
                        + "Vence en " + properties.expirationMinutes()
                        + " minutos y solo se puede usar una vez.\n"
                        + "Si no intentaste iniciar sesión, cambia tu contraseña."
        );
    }

    public void sendStatusChanged(User user, boolean enabled) {
        String status = enabled ? "activó" : "desactivó";

        mailService.send(
                user.getEmail(),
                "Autenticación de dos factores " + (enabled ? "activada" : "desactivada"),
                "Hola " + user.getName() + ",\n\n"
                        + "Se " + status + " la autenticación de dos factores "
                        + "de tu cuenta.\n"
                        + "Si no fuiste tú, cambia tu contraseña y contacta al administrador."
        );
    }
}
