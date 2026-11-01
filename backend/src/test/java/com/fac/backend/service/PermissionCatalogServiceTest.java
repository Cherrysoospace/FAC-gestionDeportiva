package com.fac.backend.service;

import com.fac.backend.authorization.PermissionOperation;
import com.fac.backend.dto.permission.PermissionCatalogResponseDTO;
import com.fac.backend.dto.permission.PermissionItemDTO;
import com.fac.backend.entity.Permission;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PermissionCatalogServiceTest {

    private final PermissionCatalogService service =
            new PermissionCatalogService(new PermissionClassifier());

    @Test
    void groupsPermissionsByModuleAndResource() {
        PermissionCatalogResponseDTO catalog = service.buildCatalog(List.of(
                permission(1L, "GET", "/api/tournaments/{id}"),
                permission(2L, "GET", "/api/users"),
                permission(3L, "POST", "/api/users"),
                permission(4L, "PUT", "/api/roles/{id}/permissions"),
                permission(5L, "DELETE", "/api/tickets/{id}")
        ));

        assertEquals(5, catalog.getTotal());
        assertEquals(
                List.of("Administración", "Gestión Deportiva", "Comercial"),
                catalog.getModules().stream()
                        .map(module -> module.getName())
                        .toList()
        );
        assertEquals(
                List.of("Usuarios", "Roles"),
                catalog.getModules().get(0).getResources().stream()
                        .map(resource -> resource.getName())
                        .toList()
        );
    }

    @Test
    void sortsItemsByModuleResourceAndOperation() {
        List<PermissionItemDTO> items = service.toItems(List.of(
                permission(1L, "DELETE", "/api/users/{id}"),
                permission(2L, "GET", "/api/users"),
                permission(3L, "GET", "/api/users/{id}")
        ));

        assertEquals(
                List.of("VER", "LISTAR", "ELIMINAR"),
                items.stream().map(item -> item.getOperation().name()).toList()
        );
        assertTrue(items.get(0).getModule().equals("Administración"));
    }

    private Permission permission(Long id, String method, String url) {
        return Permission.builder()
                .id(id)
                .method(method)
                .url(url)
                .build();
    }
}
