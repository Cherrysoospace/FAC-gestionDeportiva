package com.fac.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DiscordOAuthRequestDTO {

    @NotBlank(message = "El code es obligatorio")
    private String code;

    @NotBlank(message = "El redirectUri es obligatorio")
    private String redirectUri;
}
