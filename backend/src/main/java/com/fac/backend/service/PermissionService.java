package com.fac.backend.service;

import java.util.List;

import com.fac.backend.authorization.PermissionMatcher;
import com.fac.backend.config.CacheConfig;
import com.fac.backend.dto.PermissionRequestDTO;
import com.fac.backend.dto.PermissionResponseDTO;
import com.fac.backend.dto.permission.PermissionCatalogResponseDTO;
import com.fac.backend.entity.Permission;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.PermissionMapper;
import com.fac.backend.repository.PermissionRepository;
import com.fac.backend.repository.RolePermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PermissionService {

    private final PermissionRepository permissionRepository;

    private final PermissionMapper permissionMapper;
    private final RolePermissionRepository rolePermissionRepository;
    private final EffectivePermissionService effectivePermissionService;
    private final PermissionCatalogService permissionCatalogService;

    @CacheEvict(
            cacheNames = CacheConfig.EFFECTIVE_PERMISSIONS_CACHE,
            allEntries = true
    )
    public PermissionResponseDTO create(PermissionRequestDTO dto) {
        if (permissionRepository.existsByUrlAndMethod(
                dto.getUrl(), dto.getMethod().toUpperCase())) {
            throw new ApplicationException(ErrorCase.ALREADY_EXISTS,
                    "Ya existe un permiso con esa url y método");
        }
        return permissionMapper.toResponseDTO(
                permissionRepository.save(permissionMapper.toEntity(dto)));
    }

    @Transactional(readOnly = true)
    public List<PermissionResponseDTO> findAll() {
        return permissionRepository.findAll().stream()
                .map(permissionMapper::toResponseDTO).toList();
    }

    @Transactional(readOnly = true)
    public PermissionCatalogResponseDTO findCatalog() {
        return permissionCatalogService.buildCatalog(
                permissionRepository.findAll()
        );
    }

    @Transactional(readOnly = true)
    public PermissionResponseDTO findById(Long id) {
        return permissionMapper.toResponseDTO(findPermission(id));
    }

    @CacheEvict(
            cacheNames = CacheConfig.EFFECTIVE_PERMISSIONS_CACHE,
            allEntries = true
    )
    public PermissionResponseDTO update(Long id, PermissionRequestDTO dto) {
        Permission permission = findPermission(id);
        if (permissionRepository.existsByUrlAndMethodAndIdNot(
                dto.getUrl(), dto.getMethod().toUpperCase(), id)) {
            throw new ApplicationException(ErrorCase.ALREADY_EXISTS,
                    "Ya existe un permiso con esa url y método");
        }
        permissionMapper.updateEntity(dto, permission);
        return permissionMapper.toResponseDTO(permissionRepository.save(permission));
    }

    @CacheEvict(
            cacheNames = CacheConfig.EFFECTIVE_PERMISSIONS_CACHE,
            allEntries = true
    )
    public void delete(Long id) {
        findPermission(id);
        if (rolePermissionRepository.existsByPermissionId(id)) {
            throw new ApplicationException(ErrorCase.INVALID_OPERATION,
                    "No se puede eliminar un permiso que está asignado");
        }
        permissionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public boolean hasPermission(
            Long userId,
            String httpMethod,
            String requestUrl) {

        return effectivePermissionService.findByUserId(userId)
                .stream()
                .anyMatch(permission -> PermissionMatcher.matches(
                        permission,
                        httpMethod,
                        requestUrl
                ));
    }

    private Permission findPermission(Long id) {
        return permissionRepository.findById(id)
                .orElseThrow(() -> new ApplicationException(
                    ErrorCase.NOT_FOUND,
                    "Permiso no encontrado con id: " + id
                ));
    }
}
