package com.fac.backend.dto.common;

import java.time.LocalDateTime;
import java.util.Map;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ErrorResponseDTO {

    private final LocalDateTime timestamp;

    private final int status;

    private final String error;

    private final String errorCase;

    private final String message;

    private final String path;

    private final Map<String, String> fieldErrors;
}