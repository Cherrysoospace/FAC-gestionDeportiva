package com.fac.backend.service;

import com.fac.backend.authorization.PermissionMatcher;
import com.fac.backend.authorization.SecurityPermissions;
import com.fac.backend.entity.Permission;
import com.fac.backend.entity.Role;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.repository.PermissionRepository;
import com.fac.backend.repository.UserRoleRepository;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Política de seguridad: ningún cambio en la matriz puede dejar a la
 * plataforma sin al menos un usuario habilitado que pueda gestionar roles
 * y permisos (si no, nadie podría revertir el error).
 */
@Component
@RequiredArgsConstructor
public class ManagementAccessGuard {

    private final PermissionRepository permissionRepository;
    private final UserRoleRepository userRoleRepository;

    /**
     * @param role      rol que se está modificando
     * @param targetIds permisos que el rol tendrá después del cambio
     */
    public void assertAccessRemains(
            Role role,
            Set<Long> targetIds) {

        Long roleId = role.getId();
        List<Permission> managementPermissions = permissionRepository
                .findAll()
                .stream()
                .filter(permission -> SecurityPermissions.MANAGEMENT_KEYS.contains(
                        PermissionMatcher.key(permission)))
                .toList();

        if (managementPermissions.isEmpty()) {
            return;
        }

        Set<String> keys = managementPermissions.stream()
                .map(PermissionMatcher::key)
                .collect(Collectors.toSet());

        if (userRoleRepository
                .findUserIdsWithAllPermissions(keys, keys.size())
                .isEmpty()) {
            // Ya no existe un usuario con acceso completo: no hay bloqueo
            // adicional que evitar en esta operación.
            return;
        }

        boolean roleRetainsAll = managementPermissions.stream()
                .allMatch(permission -> targetIds.contains(permission.getId()));

        if (roleRetainsAll
                && role.isActive()
                && userRoleRepository.existsEnabledUserByRoleId(roleId)) {
            return;
        }

        boolean anotherUserRetainsAccess = !userRoleRepository
                .findUserIdsWithAllPermissionsExcludingRole(
                        roleId,
                        keys,
                        keys.size()
                )
                .isEmpty();

        if (anotherUserRetainsAccess) {
            return;
        }

        throw new ApplicationException(
                ErrorCase.INVALID_OPERATION,
                "No se puede retirar ese permiso: el sistema quedaría sin "
                        + "ningún usuario con acceso a la gestión de roles y permisos"
        );
    }
}
