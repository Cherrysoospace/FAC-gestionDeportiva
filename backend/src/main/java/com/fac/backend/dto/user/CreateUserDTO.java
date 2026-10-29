package com.fac.backend.dto.user;

import com.fac.backend.validation.StrongPassword;
import jakarta.validation.constraints.NotBlank;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUserDTO
        extends BaseUserDTO {

    @NotBlank(
            message = "La contraseña es obligatoria"
    )
    @StrongPassword
    private String password;
}
