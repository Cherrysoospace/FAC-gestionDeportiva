package com.fac.backend.mapper;

import java.util.List;

import com.fac.backend.dto.PermissionRequestDTO;
import com.fac.backend.dto.PermissionResponseDTO;
import com.fac.backend.entity.Permission;
import org.springframework.stereotype.Component;

@Component
public class PermissionMapper {

    public Permission toEntity(PermissionRequestDTO dto) {
        return Permission.builder()
                .url(dto.getUrl())
                .method(dto.getMethod().toUpperCase())
                .build();
    }

    public void updateEntity(PermissionRequestDTO dto, Permission permission) {
        permission.setUrl(dto.getUrl());
        permission.setMethod(dto.getMethod().toUpperCase());
    }

    public PermissionResponseDTO toResponseDTO(Permission permission) {
        return new PermissionResponseDTO(
                permission.getId(),
                permission.getUrl(),
                permission.getMethod()
        );
    }

    public List<PermissionResponseDTO> toResponseDTOList(List<Permission> permissions) {
        return permissions.stream()
                .map(this::toResponseDTO)
                .toList();
    }
}