package com.fac.backend.service;

import com.fac.backend.config.CacheConfig;
import com.fac.backend.dto.userrole.AssignRoleRequestDTO;
import com.fac.backend.dto.userrole.RoleUserResponseDTO;
import com.fac.backend.dto.userrole.UserRoleResponseDTO;
import com.fac.backend.entity.Role;
import com.fac.backend.entity.User;
import com.fac.backend.entity.UserRole;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.UserRoleMapper;
import com.fac.backend.repository.RoleRepository;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserRoleService {

    /** Rol que recibe toda cuenta nueva creada por registro u OAuth. */
    static final String DEFAULT_ROLE = "AFICIONADO";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserRoleMapper userRoleMapper;
    private final com.fac.backend.mapper.UserMapper userMapper;

    @CacheEvict(
            cacheNames = CacheConfig.EFFECTIVE_PERMISSIONS_CACHE,
            allEntries = true
    )
    public UserRoleResponseDTO assign(AssignRoleRequestDTO dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ApplicationException(ErrorCase.NOT_FOUND, "Usuario no encontrado"));
        Role role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new ApplicationException(ErrorCase.NOT_FOUND, "Rol no encontrado"));

        if (userRoleRepository.existsByUserIdAndRoleId(dto.getUserId(), dto.getRoleId())) {
            throw new ApplicationException(ErrorCase.ALREADY_EXISTS, "El usuario ya tiene asignado ese rol");
        }

        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRole(role);
        return userRoleMapper.toResponseDTO(userRoleRepository.save(userRole));
    }

    @Transactional
    public List<UserRoleResponseDTO> findAll() {
        return userRoleMapper.toResponseDTOList(userRoleRepository.findAll());
    }

    @Transactional
    public List<UserRoleResponseDTO> findByUserId(Long userId) {
        return userRoleMapper.toResponseDTOList(userRoleRepository.findAllByUserId(userId));
    }

    @Transactional(readOnly = true)
    public List<RoleUserResponseDTO> findByRoleId(Long roleId) {
        return userRoleMapper.toRoleUserResponseDTOList(userRoleRepository.findAllByRoleId(roleId));
    }

    @Transactional(readOnly = true)
    public List<com.fac.backend.dto.user.UserResponseDTO> findAvailableUsersByRoleId(Long roleId) {
        if (!roleRepository.existsById(roleId)) {
            throw new ApplicationException(ErrorCase.NOT_FOUND, "Rol no encontrado");
        }
        return userMapper.toResponseDTOList(userRepository.findAvailableByRoleId(roleId));
    }

    @CacheEvict(
            cacheNames = CacheConfig.EFFECTIVE_PERMISSIONS_CACHE,
            allEntries = true
    )
    public void delete(Long userId, Long roleId) {
        userRoleRepository.delete(findAssignment(userId, roleId));
    }

    /** Cuentas OAuth: el rol por defecto es obligatorio para poder usar la plataforma. */
    public void assignDefaultRole(User user) {
        Role role = roleRepository.findByNameIgnoreCase(DEFAULT_ROLE)
                .orElseThrow(() -> new IllegalStateException(
                        "El rol " + DEFAULT_ROLE + " no está configurado"
                ));
        link(user, role);
    }

    /** Registro público: si el rol aún no existe, la cuenta se crea sin roles. */
    public void assignDefaultRoleIfPresent(User user) {
        roleRepository.findByNameIgnoreCase(DEFAULT_ROLE)
                .ifPresent(role -> link(user, role));
    }

    private void link(User user, Role role) {
        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRole(role);
        userRoleRepository.save(userRole);
    }

    private UserRole findAssignment(Long userId, Long roleId) {
        return userRoleRepository.findByUserIdAndRoleId(userId, roleId)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND, "Asignación de rol no encontrada"));
    }
}
