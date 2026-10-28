package com.fac.backend.dto;

import com.fac.backend.dto.permission.PermissionItemDTO;
import com.fac.backend.dto.role.RoleResponseDTO;
import java.util.List;
import lombok.Value;

@Value
public class MeResponseDTO {

    Long id;
    String name;
    String email;
    List<RoleResponseDTO> roles;
    List<PermissionItemDTO> permissions;
}
