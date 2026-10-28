package com.fac.backend.dto.permission;

import java.util.List;
import lombok.Value;

@Value
public class RolePermissionsAssignmentDTO {

    Long roleId;
    String roleName;
    String roleDescription;
    boolean roleActive;
    List<Long> permissionIds;
    List<PermissionItemDTO> permissions;
    int totalAssigned;
    int totalAvailable;
}
