package com.fac.backend.dto.profile;

import java.time.LocalDate;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;

import lombok.Getter;
import lombok.Setter;

/**
 * Datos personales editables del perfil. Ambos son opcionales:
 * el perfil se puede completar poco a poco (HU-SE-02).
 * La foto se gestiona aparte porque llega como archivo.
 */
@Getter
@Setter
public class ProfileRequestDTO {

    @Pattern(
            regexp = "^$|^[0-9]{7,15}$",
            message = "El teléfono debe contener entre 7 y 15 dígitos"
    )
    private String phone;

    @Past(message = "La fecha de nacimiento debe estar en el pasado")
    private LocalDate birthDate;
}
