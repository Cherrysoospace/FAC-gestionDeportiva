package com.fac.backend.dto.profile;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfileRequestDTO {

    @NotBlank(
	    message = "El telÃ©fono es obligatorio"
    )
    @Pattern(
	    regexp = "^$|^[0-9]{7,15}$",
	    message = "El teléfono debe contener entre 7 y 15 dígitos"
    )
    private String phone;

    @NotNull(
	    message = "La fecha de nacimiento es obligatoria"
    )
    @Past(
	    message = "La fecha de nacimiento debe estar en el pasado"
    )
    private LocalDate birthDate;
}