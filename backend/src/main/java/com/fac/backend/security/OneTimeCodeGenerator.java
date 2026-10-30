package com.fac.backend.security;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Genera códigos numéricos de un solo uso para el segundo factor (HU-SE-10).
 * Se usa SecureRandom para que el código no sea predecible.
 */
@Component
public class OneTimeCodeGenerator {

    private final SecureRandom secureRandom = new SecureRandom();

    public String generate(int length) {
        StringBuilder code = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            code.append(secureRandom.nextInt(10));
        }
        return code.toString();
    }
}
