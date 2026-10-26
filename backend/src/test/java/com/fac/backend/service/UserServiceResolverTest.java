package com.fac.backend.service;

import com.fac.backend.entity.Role;
import com.fac.backend.entity.User;
import com.fac.backend.entity.UserRole;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.UserMapper;
import com.fac.backend.repository.RoleRepository;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.repository.UserRoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceResolverTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void createsNewOauthUserWithAficionadoRole() {
        when(userRepository.findByAuthProviderAndExternalId(
                "google.com",
                "uid-1"
        )).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("new@example.com"))
                .thenReturn(false);
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> {
                    User user = invocation.getArgument(0);
                    user.setId(10L);
                    return user;
                });

        Role role = new Role();
        role.setId(2L);
        role.setName("AFICIONADO");
        when(roleRepository.findByNameIgnoreCase("AFICIONADO"))
                .thenReturn(Optional.of(role));

        User result = userService.resolverUsuario(
                "google.com",
                "uid-1",
                "new@example.com",
                null,
                null
        );

        assertEquals("new", result.getName());
        assertEquals("new@example.com", result.getEmail());
        assertNull(result.getPassword());
        assertEquals("google.com", result.getAuthProvider());
        assertEquals("uid-1", result.getExternalId());
        assertTrue(result.isEnabled());

        ArgumentCaptor<UserRole> captor =
                ArgumentCaptor.forClass(UserRole.class);
        verify(userRoleRepository).save(captor.capture());
        assertEquals(result, captor.getValue().getUser());
        assertEquals(role, captor.getValue().getRole());
    }

    @Test
    void usesProviderNameWhenPresent() {
        when(userRepository.findByAuthProviderAndExternalId(
                "google.com",
                "uid-2"
        )).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("named@example.com"))
                .thenReturn(false);
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Role role = new Role();
        role.setName("AFICIONADO");
        when(roleRepository.findByNameIgnoreCase("AFICIONADO"))
                .thenReturn(Optional.of(role));

        User result = userService.resolverUsuario(
                "google.com",
                "uid-2",
                "named@example.com",
                "Nombre Google",
                "https://example.com/photo.png"
        );

        assertEquals("Nombre Google", result.getName());
    }

    @Test
    void returnsExistingUserByIdentity() {
        User existing = user("existing@example.com", true);
        when(userRepository.findByAuthProviderAndExternalId(
                "google.com",
                "uid-3"
        )).thenReturn(Optional.of(existing));

        User result = userService.resolverUsuario(
                "google.com",
                "uid-3",
                "existing@example.com",
                "Existing",
                null
        );

        assertEquals(existing, result);
        verify(userRepository, never()).save(any(User.class));
        verify(userRoleRepository, never()).save(any(UserRole.class));
    }

    @Test
    void rejectsEmailAlreadyUsedByAnotherMethod() {
        when(userRepository.findByAuthProviderAndExternalId(
                "google.com",
                "uid-4"
        )).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("taken@example.com"))
                .thenReturn(true);

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> userService.resolverUsuario(
                        "google.com",
                        "uid-4",
                        "taken@example.com",
                        "Taken",
                        null
                )
        );

        assertEquals(ErrorCase.ALREADY_EXISTS, exception.getErrorCase());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void rejectsDisabledExistingUser() {
        User existing = user("disabled@example.com", false);
        when(userRepository.findByAuthProviderAndExternalId(
                "google.com",
                "uid-5"
        )).thenReturn(Optional.of(existing));

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> userService.resolverUsuario(
                        "google.com",
                        "uid-5",
                        "disabled@example.com",
                        "Disabled",
                        null
                )
        );

        assertEquals(ErrorCase.FORBIDDEN, exception.getErrorCase());
    }

    private User user(String email, boolean enabled) {
        User user = new User();
        user.setId(1L);
        user.setName("User");
        user.setEmail(email);
        user.setAuthProvider("google.com");
        user.setExternalId("uid");
        user.setEnabled(enabled);
        return user;
    }
}
