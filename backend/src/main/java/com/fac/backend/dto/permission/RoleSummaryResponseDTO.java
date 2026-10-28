package com.fac.backend.dto.permission;

import java.util.List;
import lombok.Value;

@Value
public class RoleSummaryResponseDTO {

    Long roleId;
    String roleName;
    String roleDescription;
    boolean roleActive;
    long usersCount;
    int assignedCount;
    List<String> modulesWithAccess;
    int totalAvailable;
    int notAssigned;
}
