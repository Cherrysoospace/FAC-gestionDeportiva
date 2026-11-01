package com.fac.backend.service;

import com.fac.backend.dto.user.CreateUserDTO;
import com.fac.backend.dto.user.UpdateUserDTO;
import com.fac.backend.dto.user.UserDetailResponseDTO;
import com.fac.backend.dto.user.UserResponseDTO;
import com.fac.backend.dto.user.UserSessionsResponseDTO;
import com.fac.backend.dto.user.UserRolesResponseDTO;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.UserMapper;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.security.AuthProviders;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    private final UserMapper userMapper;

    private final PasswordEncoder passwordEncoder;

    private final SessionService sessionService;

    public UserResponseDTO create(CreateUserDTO dto) {
        if (userRepository.existsByEmailIgnoreCase(dto.getEmail().trim())) {
            throw new ApplicationException(
                ErrorCase.ALREADY_EXISTS,
                    "Ya existe un usuario con este email"
            );
        }
        String encodedPassword = passwordEncoder.encode(
                dto.getPassword()
        );
        User user = userMapper.toEntity(dto, encodedPassword);
        User savedUser = userRepository.save(user);
        return userMapper.toResponseDTO(savedUser);
    }
    public List<UserResponseDTO> findAll() {
        List<User> users =userRepository.findAll();
        return userMapper.toResponseDTOList(users);
    }
    private User findUser(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ApplicationException(
                ErrorCase.NOT_FOUND,
                "Usuario no encontrado con id: " + id
                ));
    }

    public UserResponseDTO findById(Long id) {
        User user = findUser(id);
        return userMapper.toResponseDTO(user);
    }

    public UserDetailResponseDTO findByIdWithProfile(Long id) {
        User user = userRepository.findWithProfileById(id)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND,
                        "Usuario no encontrado con id: " + id
                ));
        return userMapper.toDetailResponseDTO(user);
    }

    public UserSessionsResponseDTO findByIdAndSessions(Long id) {
        User user = userRepository.findWithSessionsById(id)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND,
                        "Usuario no encontrado con id: " + id
                ));
        return userMapper.toSessionsResponseDTO(user);
    }

    public UserRolesResponseDTO findByIdAndRoles(Long id) {
        User user = userRepository.findWithRolesById(id)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND,
                        "Usuario no encontrado con id: " + id
                ));
        return userMapper.toRolesResponseDTO(user);
    }

    public UserResponseDTO update(Long id, UpdateUserDTO dto) {
        User user = findUser(id);
        if (userRepository.existsByEmailIgnoreCaseAndIdNot(dto.getEmail().trim(), id)) {
            throw new ApplicationException(
                ErrorCase.ALREADY_EXISTS,
                    "El email pertenece a otro usuario"
            );
        }

        boolean changesPassword = dto.getPassword() != null
                && !dto.getPassword().isBlank();

        // Las cuentas OAuth no tienen contraseña en la plataforma (HU-SE-08)
        if (changesPassword
                && !User.LOCAL_AUTH_PROVIDER.equals(user.getAuthProvider())) {
            throw new ApplicationException(
                    ErrorCase.INVALID_OPERATION,
                    "Este usuario inicia sesión con "
                            + AuthProviders.label(user.getAuthProvider())
                            + " y no tiene contraseña en la plataforma"
            );
        }

        userMapper.updateBasicData(dto, user);

        if (changesPassword) {
            String encodedPassword = passwordEncoder.encode(
                    dto.getPassword()
            );
            user.setPassword(encodedPassword);
        }

        User updatedUser = userRepository.save(user);
        return userMapper.toResponseDTO(updatedUser);
    }

    /**
     * HU-SE-01: el usuario no se borra físicamente; se desactiva para
     * conservar su historial (sesiones, roles, perfil). Las cascadas de
     * User solo alcanzan sus propios datos, nunca roles ni permisos.
     */
    @Transactional
    public void delete(Long id, Long actorUserId) {
        changeStatus(id, false, actorUserId);
    }

    @Transactional
    public UserResponseDTO changeStatus(
            Long id,
            boolean enabled,
            Long actorUserId) {

        User user = findUser(id);

        if (!enabled && id.equals(actorUserId)) {
            throw new ApplicationException(
                    ErrorCase.INVALID_OPERATION,
                    "No puedes desactivar tu propio usuario"
            );
        }

        user.setEnabled(enabled);
        User savedUser = userRepository.save(user);

        if (!enabled) {
            sessionService.invalidateSessions(id);
        }

        return userMapper.toResponseDTO(savedUser);
    }
}
