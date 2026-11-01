package com.fac.backend.service;

import com.fac.backend.dto.user.UserResponseDTO;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.UserMapper;
import com.fac.backend.repository.RoleRepository;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.repository.UserRoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceStatusTest {

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

    @Mock
    private SessionService sessionService;

    @InjectMocks
    private UserService userService;

    @Test
    void deleteDisablesUserInsteadOfRemovingIt() {
        User user = user(5L, true);
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        userService.delete(5L, 1L);

        assertFalse(user.isEnabled());
        verify(userRepository, never()).delete(any(User.class));
        verify(sessionService).invalidateSessions(5L);
    }

    @Test
    void enablingUserDoesNotTouchSessions() {
        User user = user(5L, false);
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(userMapper.toResponseDTO(user)).thenReturn(
                new UserResponseDTO(5L, "Ana", "ana@uc.edu.co", true, User.LOCAL_AUTH_PROVIDER)
        );

        UserResponseDTO response = userService.changeStatus(5L, true, 1L);

        assertTrue(user.isEnabled());
        assertTrue(response.isEnabled());
        verify(sessionService, never()).invalidateSessions(anyLong());
    }

    @Test
    void adminCannotDisableThemselves() {
        User user = user(1L, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> userService.delete(1L, 1L)
        );

        assertEquals(ErrorCase.INVALID_OPERATION, exception.getErrorCase());
        assertTrue(user.isEnabled());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void missingUserIsReportedAsNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> userService.delete(99L, 1L)
        );

        assertEquals(ErrorCase.NOT_FOUND, exception.getErrorCase());
    }

    private User user(Long id, boolean enabled) {
        User user = new User();
        user.setId(id);
        user.setName("Ana");
        user.setEmail("ana@uc.edu.co");
        user.setEnabled(enabled);
        return user;
    }
}
