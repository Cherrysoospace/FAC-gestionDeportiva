package com.fac.backend.service;

import java.util.List;

import com.fac.backend.dto.role.RoleRequestDTO;
import com.fac.backend.dto.role.RoleResponseDTO;
import com.fac.backend.dto.RolePermissionsResponseDTO;
import com.fac.backend.config.CacheConfig;
import com.fac.backend.entity.Role;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.RoleMapper;
import com.fac.backend.repository.RoleRepository;
import com.fac.backend.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    private final RoleMapper roleMapper;

    public RoleResponseDTO create(RoleRequestDTO dto) {
        if (roleRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new ApplicationException(
                    ErrorCase.ALREADY_EXISTS,
                    "Ya existe un rol con ese nombre"
            );
        }

        Role role = roleMapper.toEntity(dto);
        return roleMapper.toResponseDTO(roleRepository.save(role));
    }

    public List<RoleResponseDTO> findAll() {
        return roleMapper.toResponseDTOList(roleRepository.findAll());
    }

    public RoleResponseDTO findById(Long id) {
        return roleMapper.toResponseDTO(findEntityById(id));
    }

    public RolePermissionsResponseDTO findByIdAndPermissions(Long id) {
        Role role = roleRepository.findWithPermissionsById(id)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND, "Rol no encontrado con id: " + id));
        return roleMapper.toPermissionsResponseDTO(role);
    }

    @CacheEvict(
            cacheNames = CacheConfig.EFFECTIVE_PERMISSIONS_CACHE,
            allEntries = true
    )
    public RoleResponseDTO update(Long id, RoleRequestDTO dto) {
        Role role = findEntityById(id);

        if (roleRepository.existsByNameIgnoreCaseAndIdNot(dto.getName(), id)) {
            throw new ApplicationException(
                    ErrorCase.ALREADY_EXISTS,
                    "Ya existe un rol con ese nombre"
            );
        }

        roleMapper.updateEntity(dto, role);
        return roleMapper.toResponseDTO(roleRepository.save(role));
    }

    @CacheEvict(
            cacheNames = CacheConfig.EFFECTIVE_PERMISSIONS_CACHE,
            allEntries = true
    )
    public void delete(Long id) {
        Role role = findEntityById(id);
        if (userRoleRepository.existsByRoleId(id)) {
            throw new ApplicationException(
                    ErrorCase.INVALID_OPERATION,
                    "No se puede eliminar un rol que estÃ¡ asignado"
            );
        }
        roleRepository.delete(role);
    }

    private Role findEntityById(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new ApplicationException(
                    ErrorCase.NOT_FOUND, "Rol no encontrado"
                ));
    }
}