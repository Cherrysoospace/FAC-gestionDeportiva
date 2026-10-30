package com.fac.backend.dto.twofactor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TwoFactorVerifyRequestDTO extends TwoFactorChallengeRequestDTO {

    @NotBlank(message = "El código de verificación es obligatorio")
    @Pattern(
            regexp = "\\d{6,10}",
            message = "El código de verificación solo tiene números"
    )
    private String code;
}
