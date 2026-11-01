package com.fac.backend.service;

import com.fac.backend.config.CacheConfig;
import com.fac.backend.entity.Permission;
import com.fac.backend.repository.PermissionRepository;
import java.lang.reflect.Method;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.annotation.Cacheable;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EffectivePermissionServiceTest {

    @Mock
    private PermissionRepository permissionRepository;

    @InjectMocks
    private EffectivePermissionService effectivePermissionService;

    @Test
    void findByUserIdReturnsDistinctPermissionsFromRepository() {
        Permission readRoles = Permission.builder()
                .id(1L)
                .method("GET")
                .url("/api/roles")
                .build();
        Permission updateRolePermissions = Permission.builder()
                .id(2L)
                .method("PUT")
                .url("/api/roles/{id}/permissions")
                .build();

        when(permissionRepository.findAllByUserId(7L))
                .thenReturn(List.of(readRoles, updateRolePermissions));

        List<Permission> result = effectivePermissionService.findByUserId(7L);

        assertEquals(2, result.size());
        assertEquals("/api/roles", result.get(0).getUrl());
        verify(permissionRepository).findAllByUserId(7L);
    }

    @Test
    void declaresCacheableAnnotationForEffectivePermissionsCache() throws NoSuchMethodException {
        Method method = EffectivePermissionService.class.getMethod("findByUserId", Long.class);
        Cacheable cacheable = method.getAnnotation(Cacheable.class);

        assertNotNull(cacheable);
        assertArrayEquals(
                new String[]{CacheConfig.EFFECTIVE_PERMISSIONS_CACHE},
                cacheable.cacheNames()
        );
        assertEquals("#userId", cacheable.key());
    }
}

