package com.fac.backend.service;

import com.fac.backend.dto.RegisterRequestDTO;
import com.fac.backend.dto.user.UserResponseDTO;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.UserMapper;
import com.fac.backend.repository.UserRepository;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * HU-SE-07: registro público con correo y contraseña. Separado del CRUD
 * administrativo de usuarios y del login.
 */
@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserRoleService userRoleService;
    private final UserMapper userMapper;

    @Transactional
    public UserResponseDTO register(RegisterRequestDTO dto) {
        String email = dto.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApplicationException(
                    ErrorCase.ALREADY_EXISTS,
                    "Ya existe una cuenta con ese correo"
            );
        }

        User user = new User();
        user.setName(dto.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setAuthProvider(User.LOCAL_AUTH_PROVIDER);
        user.setEnabled(true);

        User savedUser = userRepository.save(user);
        userRoleService.assignDefaultRoleIfPresent(savedUser);

        return userMapper.toResponseDTO(savedUser);
    }
}
