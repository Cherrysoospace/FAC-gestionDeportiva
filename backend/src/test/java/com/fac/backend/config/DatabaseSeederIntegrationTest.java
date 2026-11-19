package com.fac.backend.config;

import com.fac.backend.entity.Permission;
import com.fac.backend.entity.Role;
import com.fac.backend.entity.RolePermission;
import com.fac.backend.repository.PermissionRepository;
import com.fac.backend.repository.RolePermissionRepository;
import com.fac.backend.repository.RoleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class DatabaseSeederIntegrationTest {

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private RolePermissionRepository rolePermissionRepository;

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

    // ms-sports: el administrador deportivo gestiona todo y el aficionado solo consulta
    @Test
    void sportsRolesReceiveTheirPermissions() {
        Set<String> sportsAdmin = permissionKeysOf("ADMINISTRADOR DEPORTIVO");
        Set<String> fan = permissionKeysOf("AFICIONADO");

        assertEquals(SportsPermissionSeeds.ALL.size(), sportsAdmin.size());
        assertTrue(sportsAdmin.contains("POST /gestion-deportiva/teams"));
        assertTrue(sportsAdmin.contains("DELETE /gestion-deportiva/group-phases/{id}/teams/{id}"));

        assertTrue(fan.contains("GET /gestion-deportiva/tournaments"));
        assertTrue(fan.stream().noneMatch(key -> key.startsWith("POST ")
                || key.startsWith("PATCH ")
                || key.startsWith("DELETE ")));
    }

    private Set<String> permissionKeysOf(String roleName) {
        Role role = roleRepository.findByNameIgnoreCase(roleName).orElseThrow();
        return rolePermissionRepository.findAllByRoleId(role.getId()).stream()
                .map(RolePermission::getPermission)
                .map(p -> PermissionSeed.keyOf(p.getMethod(), p.getUrl()))
                .collect(Collectors.toSet());
    }
}
