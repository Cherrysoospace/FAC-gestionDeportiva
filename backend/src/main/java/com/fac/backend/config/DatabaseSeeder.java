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
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DatabaseSeeder {

    private static final PermissionSeed[] ADMIN_PERMISSIONS = {
            new PermissionSeed("GET", "/api/users"),
            new PermissionSeed("POST", "/api/users"),
            new PermissionSeed("GET", "/api/users/{id}"),
            new PermissionSeed("PUT", "/api/users/{id}"),
            new PermissionSeed("DELETE", "/api/users/{id}"),
            new PermissionSeed("GET", "/api/roles"),
            new PermissionSeed("POST", "/api/roles"),
            new PermissionSeed("GET", "/api/roles/{id}"),
            new PermissionSeed("PUT", "/api/roles/{id}"),
            new PermissionSeed("DELETE", "/api/roles/{id}"),
            new PermissionSeed("GET", "/api/permissions"),
            new PermissionSeed("GET", "/api/permissions/catalog"),
            new PermissionSeed("POST", "/api/permissions"),
            new PermissionSeed("GET", "/api/permissions/{id}"),
            new PermissionSeed("PUT", "/api/permissions/{id}"),
            new PermissionSeed("DELETE", "/api/permissions/{id}"),
            new PermissionSeed("GET", "/api/roles/{id}/permissions"),
            new PermissionSeed("GET", "/api/roles/{id}/summary"),
            new PermissionSeed("PUT", "/api/roles/{id}/permissions"),
            new PermissionSeed("GET", "/api/users/{id}/sessions"),
            new PermissionSeed("GET", "/api/users/{id}/sessions/{id}"),
            new PermissionSeed("DELETE", "/api/users/{id}/sessions/{id}")
    };

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRoleRepository userRoleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner seedDatabase() {
        return arguments -> {
            Role adminRole = findOrCreateRole("ADMIN", "Administrador");
            Role consultantRole = findOrCreateRole(
                    "CONSULTOR",
                    "Consulta de usuarios"
            );
            findOrCreateRole(
                    "AFICIONADO",
                    "Usuario aficionado con permisos mínimos"
            );

            User adminUser = findOrCreateUser();
            assignRole(adminUser, adminRole);

            for (PermissionSeed seed : ADMIN_PERMISSIONS) {
                assignPermission(adminRole, findOrCreatePermission(seed));
            }

            assignPermission(consultantRole, findOrCreatePermission(
                    new PermissionSeed("GET", "/api/users")
            ));
            assignPermission(consultantRole, findOrCreatePermission(
                    new PermissionSeed("GET", "/api/users/{id}")
            ));
        };
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
                    user.setPassword(passwordEncoder.encode("Admin123!"));
                    return userRepository.save(user);
                });
    }

    private Permission findOrCreatePermission(PermissionSeed seed) {
        return permissionRepository.findByUrlAndMethod(
                        seed.url(),
                        seed.method()
                )
                .orElseGet(() -> {
                    Permission permission = new Permission();
                    permission.setUrl(seed.url());
                    permission.setMethod(seed.method());
                    return permissionRepository.save(permission);
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

    private void assignPermission(Role role, Permission permission) {
        if (!rolePermissionRepository.existsByRoleIdAndPermissionId(
                role.getId(), permission.getId())) {
            RolePermission rolePermission = new RolePermission();
            rolePermission.setRole(role);
            rolePermission.setPermission(permission);
            rolePermissionRepository.save(rolePermission);
        }
    }

    private record PermissionSeed(String method, String url) {
    }
}
