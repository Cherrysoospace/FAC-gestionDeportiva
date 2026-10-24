package com.fac.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUserDTO
        extends BaseUserDTO {

    @NotBlank(
            message = "La contraseÃ±a es obligatoria"
    )
    @Size(
            min = 8,
            max = 72,
            message = "La contraseÃ±a debe tener entre 8 y 72 caracteres"
    )
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])\\S{8,72}$",
            message = "La contraseÃ±a debe contener al menos una mayÃºscula, "
                    + "una minÃºscula, un nÃºmero y un carÃ¡cter especial, "
                    + "sin espacios"
    )
    private String password;
}