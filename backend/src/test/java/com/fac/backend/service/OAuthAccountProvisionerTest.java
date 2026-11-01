package com.fac.backend.service;

import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.security.ExternalIdentity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
class OAuthAccountProvisionerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserRoleService userRoleService;

    @InjectMocks
    private OAuthAccountProvisioner provisioner;

    @Test
    void createsNewOauthUserWithAficionadoRole() {
        when(userRepository.findByAuthProviderAndExternalId(
                "google.com",
                "uid-1"
        )).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("new@example.com"))
                .thenReturn(Optional.empty());
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> {
                    User user = invocation.getArgument(0);
                    user.setId(10L);
                    return user;
                });


        User result = provisioner.resolve(new ExternalIdentity(
                "google.com",
                "uid-1",
                "new@example.com",
                null,
                null
        ));

        assertEquals("new", result.getName());
        assertEquals("new@example.com", result.getEmail());
        assertNull(result.getPassword());
        assertEquals("google.com", result.getAuthProvider());
        assertEquals("uid-1", result.getExternalId());
        assertTrue(result.isEnabled());

        verify(userRoleService).assignDefaultRole(result);
    }

    @Test
    void usesProviderNameWhenPresent() {
        when(userRepository.findByAuthProviderAndExternalId(
                "google.com",
                "uid-2"
        )).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("named@example.com"))
                .thenReturn(Optional.empty());
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));


        User result = provisioner.resolve(new ExternalIdentity(
                "google.com",
                "uid-2",
                "named@example.com",
                "Nombre Google",
                "https://example.com/photo.png"
        ));

        assertEquals("Nombre Google", result.getName());
    }

    @Test
    void returnsExistingUserByIdentity() {
        User existing = user("existing@example.com", true);
        when(userRepository.findByAuthProviderAndExternalId(
                "google.com",
                "uid-3"
        )).thenReturn(Optional.of(existing));

        User result = provisioner.resolve(new ExternalIdentity(
                "google.com",
                "uid-3",
                "existing@example.com",
                "Existing",
                null
        ));

        assertEquals(existing, result);
        verify(userRepository, never()).save(any(User.class));
        verify(userRoleService, never()).assignDefaultRole(any(User.class));
    }

    @Test
    void rejectsEmailAlreadyUsedByAnotherMethod() {
        when(userRepository.findByAuthProviderAndExternalId(
                "google.com",
                "uid-4"
        )).thenReturn(Optional.empty());
        User existing = user("taken@example.com", true);
        existing.setAuthProvider("github.com");
        when(userRepository.findByEmailIgnoreCase("taken@example.com"))
                .thenReturn(Optional.of(existing));

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> provisioner.resolve(new ExternalIdentity(
                        "google.com",
                        "uid-4",
                        "taken@example.com",
                        "Taken",
                        null
                ))
        );

        assertEquals(ErrorCase.ALREADY_EXISTS, exception.getErrorCase());
        assertEquals(
                "Ese correo ya está registrado con GitHub. "
                        + "Inicia sesión con GitHub.",
                exception.getMessage()
        );
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void tellsLocalUserToUsePassword() {
        when(userRepository.findByAuthProviderAndExternalId(
                "github.com",
                "uid-6"
        )).thenReturn(Optional.empty());
        User existing = user("local@example.com", true);
        existing.setAuthProvider(User.LOCAL_AUTH_PROVIDER);
        when(userRepository.findByEmailIgnoreCase("local@example.com"))
                .thenReturn(Optional.of(existing));

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> provisioner.resolve(new ExternalIdentity(
                        "github.com",
                        "uid-6",
                        "local@example.com",
                        "Local",
                        null
                ))
        );

        assertEquals(
                "Ese correo ya está registrado con correo y contraseña. "
                        + "Inicia sesión con correo y contraseña.",
                exception.getMessage()
        );
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
