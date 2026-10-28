package com.fac.backend.dto.permission;

import java.util.List;
import lombok.Value;

@Value
public class PermissionResourceDTO {

    String name;
    List<PermissionItemDTO> permissions;
}
