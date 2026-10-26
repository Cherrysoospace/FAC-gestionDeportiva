package com.fac.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OAuthRequestDTO {

    @NotBlank(message = "El idToken es obligatorio")
    private String idToken;
}
