package com.fac.backend.dto;

import lombok.Value;

@Value
public class RolePermissionResponseDTO {
    Long id;
    Long roleId;
    PermissionResponseDTO permission;
}
