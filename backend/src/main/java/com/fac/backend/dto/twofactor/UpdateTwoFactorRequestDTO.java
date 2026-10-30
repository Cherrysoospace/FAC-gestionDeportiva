package com.fac.backend.dto.twofactor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateTwoFactorRequestDTO {

    @NotNull(message = "Indica si quieres activar o desactivar el 2FA")
    private Boolean enabled;

    // Regla de seguridad: cambiar el 2FA exige confirmar la contraseña actual
    @NotBlank(message = "La contraseña actual es obligatoria")
    private String currentPassword;
}
