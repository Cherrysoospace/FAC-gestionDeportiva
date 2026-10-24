package com.fac.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequestDTO {

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email no tiene un formato vÃ¡lido")
    private String email;

    @NotBlank(message = "La contraseÃ±a es obligatoria")
    private String password;
}
