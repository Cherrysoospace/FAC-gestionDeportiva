package com.fac.backend.dto.session;

import java.time.LocalDateTime;

import lombok.Value;

@Value
public class SessionResponseDTO {

    Long id;

    LocalDateTime expiration;

    String code2FA;
}