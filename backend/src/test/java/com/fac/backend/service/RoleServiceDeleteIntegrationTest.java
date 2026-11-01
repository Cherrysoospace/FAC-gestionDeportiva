package com.fac.backend.service;

import com.fac.backend.entity.Permission;
import com.fac.backend.entity.Role;
import com.fac.backend.entity.RolePermission;
import com.fac.backend.repository.PermissionRepository;
import com.fac.backend.repository.RolePermissionRepository;
import com.fac.backend.repository.RoleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class RoleServiceDeleteIntegrationTest {

    @Autowired
    private RoleService roleService;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private RolePermissionRepository rolePermissionRepository;

    // HU-SE-03: eliminar un rol con permisos no debe fallar ni borrar los permisos
    @Test
    void deletesRoleWithPermissionsAndKeepsThePermissions() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        Role role = roleRepository.save(Role.builder()
                .name("ROL-" + suffix)
                .description("Rol de prueba")
                .build());
        Permission permission = permissionRepository.save(Permission.builder()
                .url("/api/prueba-" + suffix)
                .method("GET")
                .build());
        RolePermission assignment = new RolePermission();
        assignment.setRole(role);
        assignment.setPermission(permission);
        rolePermissionRepository.save(assignment);

        roleService.delete(role.getId());

        assertFalse(roleRepository.existsById(role.getId()));
        assertTrue(permissionRepository.existsById(permission.getId()));
        assertEquals(0, rolePermissionRepository.countByRoleId(role.getId()));
    }
}
