package com.fac.backend.service;

import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import org.springframework.stereotype.Component;

/**
 * Regla única para saber si una cuenta puede entrar a la plataforma.
 * La usan todos los mecanismos de login (contraseña, 2FA y OAuth).
 */
@Component
public class AccountStatusPolicy {

    static final String DISABLED_MESSAGE = "Tu usuario está deshabilitado";

    public void ensureEnabled(User user) {
        if (!user.isEnabled()) {
            throw new ApplicationException(ErrorCase.FORBIDDEN, DISABLED_MESSAGE);
        }
    }
}
