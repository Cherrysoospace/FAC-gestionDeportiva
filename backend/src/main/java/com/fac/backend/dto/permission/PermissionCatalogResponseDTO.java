package com.fac.backend.dto.permission;

import java.util.List;
import lombok.Value;

@Value
public class PermissionCatalogResponseDTO {

    List<PermissionModuleDTO> modules;
    int total;
}
