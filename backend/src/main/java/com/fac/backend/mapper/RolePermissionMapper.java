package com.fac.backend.mapper;

import com.fac.backend.dto.PermissionRoleResponseDTO;
import com.fac.backend.dto.RolePermissionResponseDTO;
import com.fac.backend.dto.role.RoleResponseDTO;
import com.fac.backend.entity.Role;
import com.fac.backend.entity.RolePermission;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RolePermissionMapper {

    private final PermissionMapper permissionMapper;

    public RolePermissionResponseDTO toResponseDTO(RolePermission rolePermission) {
        return new RolePermissionResponseDTO(
                rolePermission.getId(),
                rolePermission.getRole().getId(),
                permissionMapper.toResponseDTO(rolePermission.getPermission())
        );
    }

    public List<RolePermissionResponseDTO> toResponseDTOList(
            List<RolePermission> rolePermissions) {
        return rolePermissions.stream().map(this::toResponseDTO).toList();
    }

    public PermissionRoleResponseDTO toPermissionRoleResponseDTO(
            RolePermission rolePermission) {
        Role role = rolePermission.getRole();
        return new PermissionRoleResponseDTO(
                rolePermission.getId(),
                rolePermission.getPermission().getId(),
                new RoleResponseDTO(
                        role.getId(),
                        role.getName(),
                        role.getDescription(),
                        role.isActive()
                )
        );
    }

    public List<PermissionRoleResponseDTO> toPermissionRoleResponseDTOList(
            List<RolePermission> rolePermissions) {
        return rolePermissions.stream()
                .map(this::toPermissionRoleResponseDTO)
                .toList();
    }
}
