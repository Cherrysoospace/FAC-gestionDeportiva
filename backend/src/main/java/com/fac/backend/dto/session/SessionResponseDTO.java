package com.fac.backend.dto.session;

import java.time.LocalDateTime;

import lombok.Value;

@Value
public class SessionResponseDTO {

    Long id;

    String token;

    LocalDateTime expiration;

    String code2FA;
}