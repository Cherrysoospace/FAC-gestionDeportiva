package com.fac.backend.dto.permission;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateRolePermissionsRequestDTO {

    @NotNull(message = "La lista de permisos es obligatoria")
    private List<@NotNull(message = "El identificador del permiso no puede ser nulo") Long> permissionIds;
}
