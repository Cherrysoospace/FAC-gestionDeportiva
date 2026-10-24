package com.fac.backend.dto.session;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class SessionRequestDTO {

    @NotBlank(message = "El token es obligatorio")
    private String token;

    @NotNull(message = "La fecha de expiraciÃ³n es obligatoria")
    @Future(message = "La fecha de expiraciÃ³n debe estar en el futuro")
    private LocalDateTime expiration;

    @Size(
            min = 6,
            max = 10,
            message = "El cÃ³digo 2FA debe tener entre 6 y 10 caracteres"
    )
    private String code2FA;
}



