package com.fac.backend.service;

import com.fac.backend.entity.Role;
import com.fac.backend.entity.User;
import com.fac.backend.entity.UserRole;
import com.fac.backend.repository.RoleRepository;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.repository.UserRoleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class UserServiceOAuthIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Test
    void persistsNewOauthUserWithAficionadoRole() {
        String suffix = UUID.randomUUID().toString();
        String provider = "integration-provider";
        String uid = "uid-" + suffix;
        String email = "oauth-" + suffix + "@example.com";

        User created = userService.resolverUsuario(
                provider,
                uid,
                email,
                null,
                null
        );

        assertNotNull(created.getId());

        User saved = userRepository.findById(created.getId()).orElseThrow();

        assertEquals(provider, saved.getAuthProvider());
        assertEquals(uid, saved.getExternalId());
        assertNull(saved.getPassword());
        assertTrue(saved.isEnabled());
        assertEquals(
                email.substring(0, email.indexOf('@')),
                saved.getName()
        );

        Role aficionado = roleRepository
                .findByNameIgnoreCase("AFICIONADO")
                .orElseThrow();

        List<UserRole> roles = userRoleRepository.findAll().stream()
                .filter(userRole -> userRole.getUser().getId()
                        .equals(saved.getId()))
                .toList();

        assertEquals(1, roles.size());
        assertEquals(
                aficionado.getId(),
                roles.get(0).getRole().getId()
        );
    }
}
