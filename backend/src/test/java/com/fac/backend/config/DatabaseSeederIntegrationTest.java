package com.fac.backend.config;

import com.fac.backend.entity.Permission;
import com.fac.backend.repository.PermissionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class DatabaseSeederIntegrationTest {

    @Autowired
    private PermissionRepository permissionRepository;

    // HU-SE-05: tras arrancar, cada permiso identifica su módulo y recurso en la BD
    @Test
    void seededPermissionsHaveModuleAndResource() {
        List<Permission> permissions = permissionRepository.findAll();

        assertFalse(permissions.isEmpty());
        assertTrue(permissions.stream().allMatch(p ->
                p.getModule() != null && !p.getModule().isBlank()
                        && p.getResource() != null && !p.getResource().isBlank()));

        Permission rolesDelete = permissionRepository
                .findByUrlAndMethod("/api/roles/{id}", "DELETE")
                .orElseThrow();
        assertEquals("Administración", rolesDelete.getModule());
        assertEquals("Roles", rolesDelete.getResource());
    }
}
