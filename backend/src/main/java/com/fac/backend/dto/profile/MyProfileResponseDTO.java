package com.fac.backend.dto.profile;

import java.time.LocalDate;

/**
 * Perfil del usuario autenticado. Nombre, correo y proveedor son de solo
 * lectura: modificar el perfil no altera la información de autenticación.
 */
public record MyProfileResponseDTO(
        Long userId,
        String name,
        String email,
        String authProvider,
        String phone,
        LocalDate birthDate,
        String photoUrl) {
}
