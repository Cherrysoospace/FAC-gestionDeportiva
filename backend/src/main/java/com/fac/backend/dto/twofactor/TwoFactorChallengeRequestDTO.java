package com.fac.backend.dto.twofactor;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TwoFactorChallengeRequestDTO {

    @NotBlank(message = "El identificador del reto es obligatorio")
    private String challengeId;
}
