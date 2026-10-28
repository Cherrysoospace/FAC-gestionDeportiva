package com.fac.backend.dto.role;

import lombok.Value;

@Value
public class RoleResponseDTO {

    Long id;

    String name;

    String description;

    boolean active;
}
