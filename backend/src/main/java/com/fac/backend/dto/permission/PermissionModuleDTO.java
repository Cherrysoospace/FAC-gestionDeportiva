package com.fac.backend.dto.permission;

import java.util.List;
import lombok.Value;

@Value
public class PermissionModuleDTO {

    String name;
    List<PermissionResourceDTO> resources;
}
