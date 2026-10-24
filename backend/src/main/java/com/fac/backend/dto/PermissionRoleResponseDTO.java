package com.fac.backend.dto;

import com.fac.backend.dto.role.RoleResponseDTO;
import lombok.Value;

@Value
public class PermissionRoleResponseDTO {
    Long id;
    Long permissionId;
    RoleResponseDTO role;
}
