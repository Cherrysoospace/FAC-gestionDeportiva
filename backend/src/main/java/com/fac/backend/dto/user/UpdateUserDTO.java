package com.fac.backend.dto.user;

import com.fac.backend.validation.StrongPassword;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserDTO extends BaseUserDTO {

    // Opcional: si llega vacío o null se conserva la contraseña actual
    @StrongPassword
    private String password;
}
