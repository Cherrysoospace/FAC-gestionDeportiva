package com.fac.backend.service;

import com.fac.backend.config.CacheConfig;
import com.fac.backend.dto.AssignPermissionRequestDTO;
import com.fac.backend.dto.PermissionRoleResponseDTO;
import com.fac.backend.dto.RolePermissionResponseDTO;
import com.fac.backend.dto.permission.PermissionItemDTO;
import com.fac.backend.dto.permission.RolePermissionsAssignmentDTO;
import com.fac.backend.dto.permission.UpdateRolePermissionsRequestDTO;
import com.fac.backend.entity.Permission;
import com.fac.backend.entity.Role;
import com.fac.backend.entity.RolePermission;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.RolePermissionMapper;
import com.fac.backend.repository.PermissionRepository;
import com.fac.backend.repository.RolePermissionRepository;
import com.fac.backend.repository.RoleRepository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * HU-SE-06: asignación de permisos a roles, uno a uno o con la matriz completa.
 * La regla de "no dejar el sistema sin administrador" vive en
 * {@link ManagementAccessGuard} y el resumen del rol en {@link RoleSummaryService}.
 */
@Service
@RequiredArgsConstructor
public class RolePermissionService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final RolePermissionMapper rolePermissionMapper;
    private final PermissionCatalogService permissionCatalogService;
    private final AuditService auditService;
    private final ManagementAccessGuard managementAccessGuard;

    @CacheEvict(
            cacheNames = CacheConfig.EFFECTIVE_PERMISSIONS_CACHE,
            allEntries = true
    )
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

    @CacheEvict(
            cacheNames = CacheConfig.EFFECTIVE_PERMISSIONS_CACHE,
            allEntries = true
    )
    @Transactional
    public void delete(Long roleId, Long permissionId) {
        RolePermission assignment = rolePermissionRepository
                .findByRoleIdAndPermissionId(roleId, permissionId)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND, "Asignación de permiso no encontrada"));
        rolePermissionRepository.delete(assignment);
    }

    @Transactional(readOnly = true)
    public RolePermissionsAssignmentDTO findRolePermissions(Long roleId) {
        Role role = findRoleWithPermissions(roleId);
        List<Permission> permissions = distinctPermissions(role);

        return buildAssignment(role, permissions);
    }

    @CacheEvict(
            cacheNames = CacheConfig.EFFECTIVE_PERMISSIONS_CACHE,
            allEntries = true
    )
    @Transactional
    public RolePermissionsAssignmentDTO syncPermissions(
            Long roleId,
            UpdateRolePermissionsRequestDTO dto,
            Long actorUserId,
            String actorEmail) {

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND,
                        "Rol no encontrado con id: " + roleId
                ));

        List<Long> requestedIds = dto == null ? null : dto.getPermissionIds();
        if (requestedIds == null) {
            throw new ApplicationException(
                    ErrorCase.INVALID_OPERATION,
                    "La lista de permisos es obligatoria"
            );
        }

        if (new HashSet<>(requestedIds).size() != requestedIds.size()) {
            throw new ApplicationException(
                    ErrorCase.INVALID_OPERATION,
                    "No se permiten permisos duplicados"
            );
        }

        List<Permission> requestedPermissions =
                permissionRepository.findAllById(requestedIds);

        Map<Long, Permission> permissionsById = requestedPermissions.stream()
                .collect(Collectors.toMap(Permission::getId, Function.identity()));

        List<Long> missingIds = requestedIds.stream()
                .filter(id -> !permissionsById.containsKey(id))
                .toList();

        if (!missingIds.isEmpty()) {
            throw new ApplicationException(
                    ErrorCase.INVALID_OPERATION,
                    "No existen los permisos con id: " + missingIds
            );
        }

        Set<Long> targetIds = new LinkedHashSet<>(requestedIds);

        Map<Long, RolePermission> currentAssignments =
                rolePermissionRepository.findAllByRoleId(roleId).stream()
                        .collect(Collectors.toMap(
                                assignment -> assignment.getPermission().getId(),
                                Function.identity()
                        ));

        managementAccessGuard.assertAccessRemains(role, targetIds);

        List<RolePermission> removals = currentAssignments.values().stream()
                .filter(assignment -> !targetIds.contains(
                        assignment.getPermission().getId()))
                .toList();

        List<RolePermission> additions = new ArrayList<>();
        for (Permission permission : requestedPermissions) {
            if (!currentAssignments.containsKey(permission.getId())) {
                RolePermission assignment = new RolePermission();
                assignment.setRole(role);
                assignment.setPermission(permission);
                additions.add(assignment);
            }
        }

        if (!removals.isEmpty()) {
            rolePermissionRepository.deleteAll(removals);
        }
        if (!additions.isEmpty()) {
            rolePermissionRepository.saveAll(additions);
        }

        Set<Long> addedIds = additions.stream()
                .map(assignment -> assignment.getPermission().getId())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        Set<Long> removedIds = removals.stream()
                .map(assignment -> assignment.getPermission().getId())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (!addedIds.isEmpty() || !removedIds.isEmpty()) {
            auditService.logPermissionChange(
                    actorUserId,
                    actorEmail,
                    role,
                    addedIds,
                    removedIds,
                    targetIds
            );
        }

        return buildAssignment(role, requestedPermissions);
    }

    private RolePermissionsAssignmentDTO buildAssignment(
            Role role,
            List<Permission> permissions) {

        List<PermissionItemDTO> items = permissionCatalogService.toItems(
                permissions
        );

        return new RolePermissionsAssignmentDTO(
                role.getId(),
                role.getName(),
                role.getDescription(),
                role.isActive(),
                items.stream().map(PermissionItemDTO::getId).toList(),
                items,
                items.size(),
                Math.toIntExact(permissionRepository.count())
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
