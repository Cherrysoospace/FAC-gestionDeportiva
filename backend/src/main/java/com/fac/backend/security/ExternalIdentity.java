package com.fac.backend.security;

/**
 * Identidad que entrega un proveedor externo (Google, GitHub, Discord...)
 * después de validar a la persona. Es independiente del proveedor: los
 * servicios trabajan con este dato y no con Firebase ni con Discord.
 */
public record ExternalIdentity(
        String provider,
        String uid,
        String email,
        String name,
        String picture) {
}
