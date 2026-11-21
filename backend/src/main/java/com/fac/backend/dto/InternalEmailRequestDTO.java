package com.fac.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InternalEmailRequestDTO {

    @NotEmpty(message = "Debe indicar al menos un destinatario")
    @Size(max = 500, message = "No se pueden superar 500 destinatarios por envío")
    private List<
            @NotBlank(message = "El correo del destinatario es obligatorio")
            @Email(message = "Cada destinatario debe ser un correo válido")
            String> to;

    @NotBlank(message = "El asunto es obligatorio")
    @Size(max = 255, message = "El asunto no puede superar 255 caracteres")
    private String subject;

    @NotBlank(message = "El contenido del correo es obligatorio")
    @Size(max = 10000, message = "El contenido del correo no puede superar 10000 caracteres")
    private String body;
}
