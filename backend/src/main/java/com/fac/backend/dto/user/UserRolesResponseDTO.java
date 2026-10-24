package com.fac.backend.dto.user;

import com.fac.backend.dto.userrole.UserRoleResponseDTO;
import lombok.Value;

import java.util.List;

@Value
public class UserRolesResponseDTO {
    Long id;
    String name;
    String email;
    List<UserRoleResponseDTO> roles;
}
