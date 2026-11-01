package com.fac.backend.service;

import com.fac.backend.dto.user.CreateUserDTO;
import com.fac.backend.dto.user.UpdateUserDTO;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * HU-SE-01: reglas de creación y edición de usuarios desde la administración.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceCrudTest {

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
    void createRejectsEmailAlreadyRegisteredIgnoringCase() {
        CreateUserDTO dto = new CreateUserDTO();
        dto.setName("Ana");
        dto.setEmail(" ANA@uc.edu.co ");
        dto.setPassword("Clave123!");
        when(userRepository.existsByEmailIgnoreCase("ANA@uc.edu.co")).thenReturn(true);

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> userService.create(dto)
        );

        assertEquals(ErrorCase.ALREADY_EXISTS, exception.getErrorCase());
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateRejectsPasswordForOauthUser() {
        User oauthUser = user("google.com");
        when(userRepository.findById(3L)).thenReturn(Optional.of(oauthUser));
        when(userRepository.existsByEmailIgnoreCaseAndIdNot("ana@uc.edu.co", 3L)).thenReturn(false);

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> userService.update(3L, update("Clave123!"))
        );

        assertEquals(ErrorCase.INVALID_OPERATION, exception.getErrorCase());
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateKeepsPasswordWhenNoneIsSent() {
        User localUser = user(User.LOCAL_AUTH_PROVIDER);
        when(userRepository.findById(3L)).thenReturn(Optional.of(localUser));
        when(userRepository.existsByEmailIgnoreCaseAndIdNot("ana@uc.edu.co", 3L)).thenReturn(false);
        when(userRepository.save(localUser)).thenReturn(localUser);

        userService.update(3L, update(null));

        assertEquals("encoded-old", localUser.getPassword());
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void updateChangesPasswordForLocalUser() {
        User localUser = user(User.LOCAL_AUTH_PROVIDER);
        when(userRepository.findById(3L)).thenReturn(Optional.of(localUser));
        when(userRepository.existsByEmailIgnoreCaseAndIdNot("ana@uc.edu.co", 3L)).thenReturn(false);
        when(passwordEncoder.encode("Clave123!")).thenReturn("encoded-new");
        when(userRepository.save(localUser)).thenReturn(localUser);

        userService.update(3L, update("Clave123!"));

        assertEquals("encoded-new", localUser.getPassword());
    }

    private UpdateUserDTO update(String password) {
        UpdateUserDTO dto = new UpdateUserDTO();
        dto.setName("Ana");
        dto.setEmail("ana@uc.edu.co");
        dto.setPassword(password);
        return dto;
    }

    private User user(String provider) {
        User user = new User();
        user.setId(3L);
        user.setName("Ana");
        user.setEmail("ana@uc.edu.co");
        user.setPassword(User.LOCAL_AUTH_PROVIDER.equals(provider) ? "encoded-old" : null);
        user.setAuthProvider(provider);
        user.setEnabled(true);
        return user;
    }
}
