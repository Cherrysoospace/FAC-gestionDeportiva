package com.fac.backend.service;

import com.fac.backend.entity.Role;
import com.fac.backend.entity.User;
import com.fac.backend.entity.UserRole;
import com.fac.backend.repository.RoleRepository;
import com.fac.backend.repository.UserRoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserRoleServiceDefaultRoleTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @InjectMocks
    private UserRoleService userRoleService;

    @Test
    void assignsAficionadoToNewAccount() {
        Role role = new Role();
        role.setName("AFICIONADO");
        User user = new User();
        when(roleRepository.findByNameIgnoreCase("AFICIONADO")).thenReturn(Optional.of(role));

        userRoleService.assignDefaultRole(user);

        ArgumentCaptor<UserRole> captor = ArgumentCaptor.forClass(UserRole.class);
        verify(userRoleRepository).save(captor.capture());
        assertSame(user, captor.getValue().getUser());
        assertSame(role, captor.getValue().getRole());
    }

    @Test
    void oauthAccountsFailClearlyWhenDefaultRoleIsMissing() {
        when(roleRepository.findByNameIgnoreCase("AFICIONADO")).thenReturn(Optional.empty());

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> userRoleService.assignDefaultRole(new User())
        );

        assertEquals("El rol AFICIONADO no está configurado", exception.getMessage());
    }

    @Test
    void registrationSkipsRoleWhenItDoesNotExist() {
        when(roleRepository.findByNameIgnoreCase("AFICIONADO")).thenReturn(Optional.empty());

        userRoleService.assignDefaultRoleIfPresent(new User());

        verify(userRoleRepository, never()).save(any(UserRole.class));
    }
}
