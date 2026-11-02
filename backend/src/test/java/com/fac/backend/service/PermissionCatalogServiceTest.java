package com.fac.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fac.backend.authorization.PermissionOperation;
import com.fac.backend.dto.permission.PermissionCatalogResponseDTO;
import com.fac.backend.dto.permission.PermissionItemDTO;
import com.fac.backend.entity.Permission;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PermissionCatalogServiceTest {

    private PermissionCatalogService catalogService;

    @BeforeEach
    void setUp() {
        catalogService = new PermissionCatalogService(new PermissionClassifier());
    }

    @Test
    @DisplayName("HU-SE-06: agrupa permisos por módulo y recurso en el orden definido por la matriz")
    void buildCatalogShouldGroupAndOrderByModuleAndResource() {
        Permission listTournaments = Permission.builder()
                .id(1L)
                .method("GET")
                .url("/api/torneos")
                .build();
        Permission listRoles = Permission.builder()
                .id(2L)
                .method("GET")
                .url("/api/roles")
                .build();
        Permission createRoles = Permission.builder()
                .id(3L)
                .method("POST")
                .url("/api/roles")
                .build();

        PermissionCatalogResponseDTO catalog = catalogService.buildCatalog(
                List.of(listTournaments, createRoles, listRoles)
        );

        assertEquals(3, catalog.getTotal());
        assertEquals(2, catalog.getModules().size());
        assertEquals("Administración", catalog.getModules().get(0).getName());
        assertEquals("Gestión Deportiva", catalog.getModules().get(1).getName());

        var rolesResource = catalog.getModules().get(0).getResources().get(0);
        assertEquals("Roles", rolesResource.getName());
        assertEquals(2, rolesResource.getPermissions().size());
        assertEquals(PermissionOperation.LISTAR, rolesResource.getPermissions().get(0).getOperation());
        assertEquals(PermissionOperation.CREAR, rolesResource.getPermissions().get(1).getOperation());
    }

    @Test
    @DisplayName("HU-SE-05: clasifica un endpoint con comodín ? como operación VER sobre recurso individual")
    void toItemsShouldClassifyWildcardSegmentAsVerOperation() {
        Permission getRoleByWildcard = Permission.builder()
                .id(4L)
                .method("GET")
                .url("api/v1/roles/?")
                .build();

        List<PermissionItemDTO> items = catalogService.toItems(List.of(getRoleByWildcard));

        assertEquals(1, items.size());
        assertEquals(PermissionOperation.VER, items.get(0).getOperation());
    }

    @Test
    @DisplayName("HU-SE-06: devuelve lista vacía cuando la colección de permisos es nula")
    void toItemsShouldReturnEmptyListWhenNull() {
        assertTrue(catalogService.toItems(null).isEmpty());
    }
}
