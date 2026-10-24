package com.fac.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PermissionRequestDTO {

    @NotBlank(message = "La url es obligatoria")
    @Size(max = 255, message = "La url no puede superar 255 caracteres")
    private String url;

    @NotBlank(message = "El mÃ©todo es obligatorio")
    @Size(max = 10, message = "El mÃ©todo no puede superar 10 caracteres")
    private String method;
}
