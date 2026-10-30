package com.fac.backend.config;

import com.fac.backend.entity.Permission;
import com.fac.backend.entity.Role;
import com.fac.backend.entity.RolePermission;
import com.fac.backend.entity.User;
import com.fac.backend.entity.UserRole;
import com.fac.backend.repository.PermissionRepository;
import com.fac.backend.repository.RolePermissionRepository;
import com.fac.backend.repository.RoleRepository;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.repository.UserRoleRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DatabaseSeeder {

    private static final List<PermissionSeed> ADMIN_PERMISSIONS = List.of(
            // Administración - Usuarios
            new PermissionSeed("GET", "/api/users"),
            new PermissionSeed("POST", "/api/users"),
            new PermissionSeed("GET", "/api/users/{id}"),
            new PermissionSeed("PUT", "/api/users/{id}"),
            new PermissionSeed("DELETE", "/api/users/{id}"),
            new PermissionSeed("PATCH", "/api/users/{id}/status"),
            new PermissionSeed("GET", "/api/users/{id}/detail-with-roles"),
            // Administración - Perfiles
            new PermissionSeed("GET", "/api/users/{id}/profile"),
            new PermissionSeed("POST", "/api/users/{id}/profile"),
            new PermissionSeed("PUT", "/api/users/{id}/profile"),
            new PermissionSeed("DELETE", "/api/users/{id}/profile"),
            // Administración - Roles
            new PermissionSeed("GET", "/api/roles"),
            new PermissionSeed("POST", "/api/roles"),
            new PermissionSeed("GET", "/api/roles/{id}"),
            new PermissionSeed("PUT", "/api/roles/{id}"),
            new PermissionSeed("DELETE", "/api/roles/{id}"),
            new PermissionSeed("GET", "/api/roles/{id}/detail-with-permissions"),
            new PermissionSeed("GET", "/api/roles/{id}/permissions"),
            new PermissionSeed("GET", "/api/roles/{id}/summary"),
            new PermissionSeed("PUT", "/api/roles/{id}/permissions"),
            // Administración - Permisos
            new PermissionSeed("GET", "/api/permissions"),
            new PermissionSeed("GET", "/api/permissions/catalog"),
            new PermissionSeed("POST", "/api/permissions"),
            new PermissionSeed("GET", "/api/permissions/{id}"),
            new PermissionSeed("PUT", "/api/permissions/{id}"),
            new PermissionSeed("DELETE", "/api/permissions/{id}"),
            // Administración - Asignación de roles y permisos
            new PermissionSeed("GET", "/api/user-roles"),
            new PermissionSeed("POST", "/api/user-roles"),
            new PermissionSeed("GET", "/api/user-roles/users/{id}"),
            new PermissionSeed("GET", "/api/user-roles/roles/{id}"),
            new PermissionSeed("GET", "/api/user-roles/roles/{id}/available-users"),
            new PermissionSeed("DELETE", "/api/user-roles/{id}/{id}"),
            new PermissionSeed("GET", "/api/role-permissions"),
            new PermissionSeed("POST", "/api/role-permissions"),
            new PermissionSeed("GET", "/api/role-permissions/roles/{id}"),
            new PermissionSeed("GET", "/api/role-permissions/permissions/{id}"),
            new PermissionSeed("DELETE", "/api/role-permissions/{id}/{id}"),
            // Gestión Deportiva (recursos del mockup HU-SE-06)
            new PermissionSeed("GET", "/api/torneos"),
            new PermissionSeed("GET", "/api/torneos/{id}"),
            new PermissionSeed("POST", "/api/torneos"),
            new PermissionSeed("PUT", "/api/torneos/{id}"),
            new PermissionSeed("DELETE", "/api/torneos/{id}"),
            new PermissionSeed("GET", "/api/equipos"),
            new PermissionSeed("GET", "/api/equipos/{id}"),
            new PermissionSeed("POST", "/api/equipos"),
            new PermissionSeed("PUT", "/api/equipos/{id}"),
            new PermissionSeed("DELETE", "/api/equipos/{id}"),
            new PermissionSeed("GET", "/api/jugadores"),
            new PermissionSeed("GET", "/api/jugadores/{id}"),
            new PermissionSeed("POST", "/api/jugadores"),
            new PermissionSeed("PUT", "/api/jugadores/{id}"),
            new PermissionSeed("DELETE", "/api/jugadores/{id}"),
            new PermissionSeed("GET", "/api/partidos"),
            new PermissionSeed("GET", "/api/partidos/{id}"),
            new PermissionSeed("POST", "/api/partidos"),
            new PermissionSeed("PUT", "/api/partidos/{id}"),
            new PermissionSeed("DELETE", "/api/partidos/{id}"),
            // Comercial
            new PermissionSeed("GET", "/api/entradas"),
            new PermissionSeed("GET", "/api/entradas/{id}"),
            new PermissionSeed("POST", "/api/entradas"),
            new PermissionSeed("PUT", "/api/entradas/{id}"),
            new PermissionSeed("DELETE", "/api/entradas/{id}"),
            // Infraestructura
            new PermissionSeed("GET", "/api/escenarios"),
            new PermissionSeed("GET", "/api/escenarios/{id}"),
            new PermissionSeed("POST", "/api/escenarios"),
            new PermissionSeed("PUT", "/api/escenarios/{id}"),
            new PermissionSeed("DELETE", "/api/escenarios/{id}"),
            // Reportes
            new PermissionSeed("GET", "/api/reportes"),
            new PermissionSeed("GET", "/api/reportes/{id}"),
            new PermissionSeed("POST", "/api/reportes"),
            new PermissionSeed("PUT", "/api/reportes/{id}"),
            new PermissionSeed("DELETE", "/api/reportes/{id}"),
            // Seguridad - Sesiones
            new PermissionSeed("GET", "/api/users/{id}/sessions"),
            new PermissionSeed("GET", "/api/users/{id}/sessions/{id}"),
            new PermissionSeed("DELETE", "/api/users/{id}/sessions/{id}")
    );

    private static final List<PermissionSeed> COORDINATOR_PERMISSIONS = List.of(
            new PermissionSeed("GET", "/api/torneos"),
            new PermissionSeed("GET", "/api/equipos"),
            new PermissionSeed("GET", "/api/jugadores"),
            new PermissionSeed("GET", "/api/partidos")
    );

    private static final List<PermissionSeed> CONSULTANT_PERMISSIONS = List.of(
            new PermissionSeed("GET", "/api/users"),
            new PermissionSeed("GET", "/api/users/{id}")
    );

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRoleRepository userRoleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-password:Admin123!}")
    private String adminPassword;

    @Bean
    CommandLineRunner seedDatabase() {
        return arguments -> {
            Role adminRole = findOrCreateRole(
                    "ADMIN",
                    "Administrador general con acceso total a la plataforma"
            );
            Role coordinatorRole = findOrCreateRole(
                    "COORDINADOR",
                    "Coordinador de torneos, equipos, jugadores y programación"
            );
            findOrCreateRole(
                    "OPERADOR",
                    "Operador comercial y de escenarios deportivos"
            );
            Role consultantRole = findOrCreateRole(
                    "CONSULTOR",
                    "Consulta de información y reportes del sistema"
            );
            findOrCreateRole(
                    "JUEZ DEPORTIVO",
                    "Registro de resultados y acontecimientos de partidos"
            );
            findOrCreateRole(
                    "AFICIONADO",
                    "Usuario aficionado con permisos básicos (rol por defecto)"
            );

            User adminUser = findOrCreateUser();
            assignRole(adminUser, adminRole);

            // Se cargan todos los permisos en una sola consulta (sin consultas en ciclos)
            Map<String, Permission> permissionsByKey = permissionRepository.findAll()
                    .stream()
                    .collect(Collectors.toMap(
                            p -> permissionKey(p.getMethod(), p.getUrl()),
                            Function.identity(),
                            (first, second) -> first
                    ));

            List<Permission> missingPermissions = ADMIN_PERMISSIONS.stream()
                    .filter(seed -> !permissionsByKey.containsKey(seed.key()))
                    .map(seed -> Permission.builder()
                            .method(seed.method())
                            .url(seed.url())
                            .build())
                    .toList();

            if (!missingPermissions.isEmpty()) {
                permissionRepository.saveAll(missingPermissions).forEach(
                        saved -> permissionsByKey.put(
                                permissionKey(saved.getMethod(), saved.getUrl()),
                                saved
                        )
                );
            }

            assignPermissionsInBatch(adminRole, ADMIN_PERMISSIONS, permissionsByKey);
            assignPermissionsInBatch(coordinatorRole, COORDINATOR_PERMISSIONS, permissionsByKey);
            assignPermissionsInBatch(consultantRole, CONSULTANT_PERMISSIONS, permissionsByKey);
        };
    }

    private void assignPermissionsInBatch(
            Role role,
            List<PermissionSeed> seeds,
            Map<String, Permission> permissionsByKey) {

        Set<Long> existingPermissionIds = rolePermissionRepository
                .findAllByRoleId(role.getId())
                .stream()
                .map(rp -> rp.getPermission().getId())
                .collect(Collectors.toSet());

        List<RolePermission> toAssign = new ArrayList<>();

        for (PermissionSeed seed : seeds) {
            Permission permission = permissionsByKey.get(seed.key());
            if (permission != null
                    && !existingPermissionIds.contains(permission.getId())) {
                RolePermission rolePermission = new RolePermission();
                rolePermission.setRole(role);
                rolePermission.setPermission(permission);
                toAssign.add(rolePermission);
                existingPermissionIds.add(permission.getId());
            }
        }

        if (!toAssign.isEmpty()) {
            rolePermissionRepository.saveAll(toAssign);
        }
    }

    private static String permissionKey(String method, String url) {
        return method.toUpperCase(Locale.ROOT) + " " + url;
    }

    private Role findOrCreateRole(String name, String description) {
        return roleRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(name);
                    role.setDescription(description);
                    return roleRepository.save(role);
                });
    }

    private User findOrCreateUser() {
        return userRepository.findByEmail("admin@uc.edu.co")
                .orElseGet(() -> {
                    User user = new User();
                    user.setName("Administrador");
                    user.setEmail("admin@uc.edu.co");
                    user.setPassword(passwordEncoder.encode(adminPassword));
                    return userRepository.save(user);
                });
    }

    private void assignRole(User user, Role role) {
        if (!userRoleRepository.existsByUserIdAndRoleId(
                user.getId(), role.getId())) {
            UserRole userRole = new UserRole();
            userRole.setUser(user);
            userRole.setRole(role);
            userRoleRepository.save(userRole);
        }
    }

    private record PermissionSeed(String method, String url) {
        String key() {
            return permissionKey(method, url);
        }
    }
}
