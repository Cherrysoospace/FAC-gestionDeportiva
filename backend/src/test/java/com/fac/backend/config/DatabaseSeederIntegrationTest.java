  package com.fac.backend.config;

import com.fac.backend.entity.Permission;
import com.fac.backend.entity.Role;
import com.fac.backend.entity.RolePermission;
import com.fac.backend.entity.User;
import com.fac.backend.repository.PermissionRepository;
import com.fac.backend.repository.RolePermissionRepository;
import com.fac.backend.repository.RoleRepository;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.repository.UserRoleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private CommandLineRunner seedDatabase;

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

    // ms-sports: el administrador deportivo gestiona todo y el aficionado consulta y autogestiona /me/...
    @Test
    void sportsRolesReceiveTheirPermissions() {
        Set<String> admin = permissionKeysOf("ADMIN");
        Set<String> sportsAdmin = permissionKeysOf("ADMINISTRADOR DEPORTIVO");
        Set<String> fan = permissionKeysOf("AFICIONADO");

        assertEquals(SportsPermissionSeeds.ALL.size(), sportsAdmin.size());
        assertTrue(admin.containsAll(sportsAdmin));
        assertTrue(sportsAdmin.contains("POST /gestion-deportiva/teams"));
        assertTrue(sportsAdmin.contains("DELETE /gestion-deportiva/group-phases/{id}/teams/{id}"));
        assertTrue(sportsAdmin.contains("PUT /gestion-deportiva/matches/{id}/result"));
        assertTrue(sportsAdmin.contains("PATCH /gestion-deportiva/bets/{id}/void"));
        assertTrue(sportsAdmin.contains("POST /gestion-deportiva/fans"));
        assertTrue(sportsAdmin.stream().noneMatch(key -> key.contains(" /gestion-deportiva/me/")));
        assertTrue(admin.contains("POST /gestion-deportiva/me/fan"));

        assertEquals(SportsPermissionSeeds.FAN_PERMISSIONS.size(), fan.size());
        assertTrue(fan.contains("GET /gestion-deportiva/tournaments"));
        assertTrue(fan.contains("GET /gestion-deportiva/goals"));
        assertTrue(fan.contains("GET /gestion-deportiva/payment-methods"));
        assertTrue(fan.contains("GET /gestion-deportiva/tickets/availability"));
        assertTrue(fan.contains("GET /gestion-deportiva/bets/available-matches"));
        assertTrue(fan.contains("POST /gestion-deportiva/me/fan"));
        assertTrue(fan.contains("POST /gestion-deportiva/me/favorite-teams"));
        assertTrue(fan.contains("POST /gestion-deportiva/me/payment-methods"));
        assertTrue(fan.contains("POST /gestion-deportiva/me/tickets"));
        assertTrue(fan.contains("PATCH /gestion-deportiva/me/bets/{id}/cancel"));
        assertFalse(fan.contains("GET /gestion-deportiva/fans"));
        assertFalse(fan.contains("GET /gestion-deportiva/tickets"));
        assertFalse(fan.contains("GET /gestion-deportiva/bets"));
        assertTrue(fan.stream()
                .filter(key -> key.startsWith("POST ")
                        || key.startsWith("PUT ")
                        || key.startsWith("PATCH ")
                        || key.startsWith("DELETE "))
                .allMatch(key -> key.contains(" /gestion-deportiva/me/")));
    }

    @Test
    void seederIsIdempotentWhenRunAgain() throws Exception {
        long permissionsBefore = permissionRepository.count();
        long rolePermissionsBefore = rolePermissionRepository.count();

        seedDatabase.run();

        assertEquals(permissionsBefore, permissionRepository.count());
        assertEquals(rolePermissionsBefore, rolePermissionRepository.count());
        assertEquals(SportsPermissionSeeds.ALL.size(), permissionKeysOf("ADMINISTRADOR DEPORTIVO").size());
        assertEquals(SportsPermissionSeeds.FAN_PERMISSIONS.size(), permissionKeysOf("AFICIONADO").size());
    }

    // BD sembradas con la versión anterior: el admin deportivo tenía /me/... y se le retira
    @Test
    void seederRevokesFanSelfServiceFromSportsAdmin() throws Exception {
        Role sportsAdmin = roleRepository.findByNameIgnoreCase("ADMINISTRADOR DEPORTIVO").orElseThrow();
        Permission meFan = permissionRepository
                .findByUrlAndMethod("/gestion-deportiva/me/fan", "GET")
                .orElseThrow();
        RolePermission stale = new RolePermission();
        stale.setRole(sportsAdmin);
        stale.setPermission(meFan);
        rolePermissionRepository.save(stale);
        assertTrue(permissionKeysOf("ADMINISTRADOR DEPORTIVO").contains("GET /gestion-deportiva/me/fan"));

        seedDatabase.run();

        assertFalse(permissionKeysOf("ADMINISTRADOR DEPORTIVO").contains("GET /gestion-deportiva/me/fan"));
        assertEquals(SportsPermissionSeeds.ALL.size(), permissionKeysOf("ADMINISTRADOR DEPORTIVO").size());
    }

    // El script simulador se autentica con un usuario de servicio sembrado
    @Test
    void simulatorServiceUserIsSeededWithItsRole() {
        User simulator = userRepository.findByEmail(DatabaseSeeder.SIMULATOR_EMAIL).orElseThrow();
        Role simulatorRole = roleRepository.findByNameIgnoreCase("SIMULADOR DE POSICIONES").orElseThrow();

        assertTrue(simulator.isEnabled());
        assertTrue(userRoleRepository.existsByUserIdAndRoleId(simulator.getId(), simulatorRole.getId()));
        assertEquals(SportsPermissionSeeds.POSITION_SIMULATOR.size(),
                permissionKeysOf("SIMULADOR DE POSICIONES").size());
    }

    private Set<String> permissionKeysOf(String roleName) {
        Role role = roleRepository.findByNameIgnoreCase(roleName).orElseThrow();
        return rolePermissionRepository.findAllByRoleId(role.getId()).stream()
                .map(RolePermission::getPermission)
                .map(p -> PermissionSeed.keyOf(p.getMethod(), p.getUrl()))
                .collect(Collectors.toSet());
    }
}
