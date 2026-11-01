package com.fac.backend.service;

import com.fac.backend.dto.MeResponseDTO;
import com.fac.backend.dto.role.RoleResponseDTO;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.RoleMapper;
import com.fac.backend.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * /api/auth/me: quién es el usuario autenticado, sus roles y sus permisos
 * efectivos. El frontend lo usa para mostrar u ocultar menús y acciones.
 */
@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;
    private final RoleMapper roleMapper;
    private final EffectivePermissionService effectivePermissionService;
    private final PermissionCatalogService permissionCatalogService;

    @Transactional(readOnly = true)
    public MeResponseDTO me(Long userId) {
        User user = userRepository.findWithRolesById(userId)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND,
                        "Usuario no encontrado con id: " + userId
                ));

        List<RoleResponseDTO> roles = user.getUserRoles().stream()
                .map(userRole -> roleMapper.toResponseDTO(userRole.getRole()))
                .toList();

        return new MeResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                roles,
                permissionCatalogService.toItems(
                        effectivePermissionService.findByUserId(userId)
                )
        );
    }
}
