package com.fac.backend.dto;

import java.util.List;
import lombok.Value;

@Value
public class RolePermissionsResponseDTO {
    Long id;
    String name;
    String description;
    List<RolePermissionResponseDTO> permissions;
}
