package com.fac.backend.dto.user;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserStatusDTO {

    @NotNull(message = "El estado habilitado es obligatorio")
    private Boolean enabled;
}
