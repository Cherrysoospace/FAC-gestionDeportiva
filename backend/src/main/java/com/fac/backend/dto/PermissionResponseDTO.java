package com.fac.backend.dto;

import lombok.Value;

@Value
public class PermissionResponseDTO {
    Long id;
    String url;
    String method;
}
