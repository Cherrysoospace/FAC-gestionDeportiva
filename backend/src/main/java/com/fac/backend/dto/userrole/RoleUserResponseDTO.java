package com.fac.backend.dto.userrole;

import com.fac.backend.dto.user.UserResponseDTO;
import lombok.Value;

@Value
public class RoleUserResponseDTO {
    Long id;
    Long roleId;
    UserResponseDTO user;
}
