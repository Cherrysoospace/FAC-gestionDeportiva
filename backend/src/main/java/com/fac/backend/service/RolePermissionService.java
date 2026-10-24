package com.fac.backend.service;

import com.fac.backend.dto.AssignPermissionRequestDTO;
import com.fac.backend.dto.PermissionRoleResponseDTO;
import com.fac.backend.dto.RolePermissionResponseDTO;
import com.fac.backend.entity.Permission;
import com.fac.backend.entity.Role;
import com.fac.backend.entity.RolePermission;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.RolePermissionMapper;
import com.fac.backend.repository.PermissionRepository;
import com.fac.backend.repository.RolePermissionRepository;
import com.fac.backend.repository.RoleRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RolePermissionService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final RolePermissionMapper rolePermissionMapper;

    @Transactional
    public RolePermissionResponseDTO assign(AssignPermissionRequestDTO dto) {
        Role role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND, "Rol no encontrado"));
        Permission permission = permissionRepository.findById(dto.getPermissionId())
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND, "Permiso no encontrado"));

        if (rolePermissionRepository.existsByRoleIdAndPermissionId(
                dto.getRoleId(), dto.getPermissionId())) {
            throw new ApplicationException(ErrorCase.ALREADY_EXISTS,
                    "El rol ya tiene asignado ese permiso");
        }

        RolePermission rolePermission = new RolePermission();
        rolePermission.setRole(role);
        rolePermission.setPermission(permission);
        return rolePermissionMapper.toResponseDTO(rolePermissionRepository.save(rolePermission));
    }

    @Transactional(readOnly = true)
    public List<RolePermissionResponseDTO> findAll() {
        return rolePermissionMapper.toResponseDTOList(rolePermissionRepository.findAll());
    }

    @Transactional(readOnly = true)
    public List<RolePermissionResponseDTO> findByRoleId(Long roleId) {
        return rolePermissionMapper.toResponseDTOList(
                rolePermissionRepository.findAllByRoleId(roleId));
    }

    @Transactional(readOnly = true)
    public List<PermissionRoleResponseDTO> findByPermissionId(Long permissionId) {
        return rolePermissionMapper.toPermissionRoleResponseDTOList(
                rolePermissionRepository.findAllByPermissionId(permissionId));
    }

    @Transactional
    public void delete(Long roleId, Long permissionId) {
        RolePermission assignment = rolePermissionRepository
                .findByRoleIdAndPermissionId(roleId, permissionId)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND, "AsignaciÃ³n de permiso no encontrada"));
        rolePermissionRepository.delete(assignment);
    }
}
