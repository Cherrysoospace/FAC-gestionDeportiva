package com.fac.backend.service;

import com.fac.backend.dto.permission.PermissionItemDTO;
import com.fac.backend.dto.permission.RoleSummaryResponseDTO;
import com.fac.backend.entity.Permission;
import com.fac.backend.entity.Role;
import com.fac.backend.entity.RolePermission;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.repository.PermissionRepository;
import com.fac.backend.repository.RoleRepository;
import com.fac.backend.repository.UserRoleRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Panel de resumen del rol en la matriz de permisos: usuarios, permisos
 * asignados, módulos y cuántos permisos quedan disponibles. Solo lectura.
 */
@Service
@RequiredArgsConstructor
public class RoleSummaryService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRoleRepository userRoleRepository;
    private final PermissionCatalogService permissionCatalogService;

    @Transactional(readOnly = true)
    public RoleSummaryResponseDTO findRoleSummary(Long roleId) {
        Role role = findRoleWithPermissions(roleId);
        List<Permission> permissions = distinctPermissions(role);
        List<PermissionItemDTO> items = permissionCatalogService.toItems(permissions);

        List<String> modules = items.stream()
                .map(PermissionItemDTO::getModule)
                .distinct()
                .toList();

        int totalAvailable = Math.toIntExact(permissionRepository.count());
        int assignedCount = permissions.size();

        return new RoleSummaryResponseDTO(
                role.getId(),
                role.getName(),
                role.getDescription(),
                role.isActive(),
                userRoleRepository.countByRoleId(roleId),
                assignedCount,
                modules,
                totalAvailable,
                Math.max(totalAvailable - assignedCount, 0)
        );
    }

    private Role findRoleWithPermissions(Long roleId) {
        return roleRepository.findWithPermissionsById(roleId)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND,
                        "Rol no encontrado con id: " + roleId
                ));
    }

    private List<Permission> distinctPermissions(Role role) {
        return role.getRolePermissions().stream()
                .map(RolePermission::getPermission)
                .distinct()
                .toList();
    }
}
