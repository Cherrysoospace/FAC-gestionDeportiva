package com.fac.backend.dto.userrole;

import com.fac.backend.dto.role.RoleResponseDTO;
import lombok.Value;

@Value
public class UserRoleResponseDTO {
    Long id;
    Long userId;
    RoleResponseDTO role;
}
