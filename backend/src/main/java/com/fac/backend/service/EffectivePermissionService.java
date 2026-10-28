package com.fac.backend.service;

import com.fac.backend.entity.Permission;
import com.fac.backend.repository.PermissionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EffectivePermissionService {

    private final PermissionRepository permissionRepository;

    @Cacheable(cacheNames = "effectivePermissions", key = "#userId")
    @Transactional(readOnly = true)
    public List<Permission> findByUserId(Long userId) {
        return permissionRepository.findAllByUserId(userId);
    }
}
