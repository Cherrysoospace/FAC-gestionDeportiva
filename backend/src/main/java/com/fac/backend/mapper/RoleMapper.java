package com.fac.backend.mapper;

import com.fac.backend.dto.role.RoleRequestDTO;
import com.fac.backend.dto.role.RoleResponseDTO;
import com.fac.backend.entity.Role;
import com.fac.backend.dto.RolePermissionsResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RoleMapper {

    private final RolePermissionMapper rolePermissionMapper;

    public Role toEntity(RoleRequestDTO dto) {
        Role role = new Role();
        role.setName(dto.getName());
        role.setDescription(dto.getDescription());
        role.setActive(dto.getActive() == null || dto.getActive());
        return role;
    }

    public void updateEntity(RoleRequestDTO dto, Role role) {
        role.setName(dto.getName());
        role.setDescription(dto.getDescription());
        if (dto.getActive() != null) {
            role.setActive(dto.getActive());
        }
    }

    public RoleResponseDTO toResponseDTO(Role role) {
        return new RoleResponseDTO(
                role.getId(),
                role.getName(),
                role.getDescription(),
                role.isActive()
        );
    }

    public List<RoleResponseDTO> toResponseDTOList(List<Role> roles) {
        return roles.stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public RolePermissionsResponseDTO toPermissionsResponseDTO(Role role) {
        return new RolePermissionsResponseDTO(
                role.getId(),
                role.getName(),
                role.getDescription(),
                rolePermissionMapper.toResponseDTOList(role.getRolePermissions())
        );
    }
}
