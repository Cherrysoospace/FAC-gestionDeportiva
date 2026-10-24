package com.fac.backend.dto.user;

import lombok.Value;

@Value
public class UserResponseDTO {
    Long id;
    String name;
    String email;
}