package com.fac.backend.service;

import com.fac.backend.dto.PermissionRequestDTO;
import com.fac.backend.dto.PermissionResponseDTO;
import com.fac.backend.entity.Permission;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.PermissionMapper;
import com.fac.backend.repository.PermissionRepository;
import com.fac.backend.repository.RolePermissionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PermissionServiceTest {

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private RolePermissionRepository rolePermissionRepository;

    @Spy
    private PermissionClassifier permissionClassifier = new PermissionClassifier();

    @Spy
    private PermissionMapper permissionMapper = new PermissionMapper();

    @Spy
    private PermissionCatalogService permissionCatalogService =
            new PermissionCatalogService(new PermissionClassifier());

    @InjectMocks
    private PermissionService permissionService;

    // HU-SE-05: /api/users/7/ es el mismo permiso que GET /api/users/{id}
    @Test
    void rejectsDuplicateWrittenWithConcreteIdAndTrailingSlash() {
        when(permissionRepository.existsByUrlAndMethod("/api/users/{id}", "GET"))
                .thenReturn(true);

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> permissionService.create(request(" /api/users/7/ ", "get", null, null))
        );

        assertEquals(ErrorCase.ALREADY_EXISTS, exception.getErrorCase());
        verify(permissionRepository, never()).save(any());
    }

    @Test
    void storesModuleAndResourceDerivedFromUrlWhenMissing() {
        when(permissionRepository.save(any(Permission.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PermissionResponseDTO created = permissionService.create(
                request("/api/roles/{id}", "DELETE", " ", null)
        );

        assertEquals("/api/roles/{id}", created.getUrl());
        assertEquals("DELETE", created.getMethod());
        assertEquals("Administración", created.getModule());
        assertEquals("Roles", created.getResource());
    }

    @Test
    void keepsModuleAndResourceGivenByAdministrator() {
        when(permissionRepository.save(any(Permission.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PermissionResponseDTO created = permissionService.create(
                request("/api/torneos", "POST", " Gestión Deportiva ", "Torneos")
        );

        assertEquals("Gestión Deportiva", created.getModule());
        assertEquals("Torneos", created.getResource());
    }

    private PermissionRequestDTO request(
            String url,
            String method,
            String module,
            String resource) {
        PermissionRequestDTO dto = new PermissionRequestDTO();
        dto.setUrl(url);
        dto.setMethod(method);
        dto.setModule(module);
        dto.setResource(resource);
        return dto;
    }
}
