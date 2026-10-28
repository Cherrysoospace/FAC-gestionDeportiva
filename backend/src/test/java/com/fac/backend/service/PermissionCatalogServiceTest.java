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
            new PermissionCatalogService();

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
    void derivesOperationsFromHttpMethodAndUrl() {
        assertEquals(
                PermissionOperation.LISTAR,
                service.resolveOperation("GET", "/api/users")
        );
        assertEquals(
                PermissionOperation.VER,
                service.resolveOperation("GET", "/api/users/1")
        );
        assertEquals(
                PermissionOperation.CREAR,
                service.resolveOperation("POST", "/api/users")
        );
        assertEquals(
                PermissionOperation.ACTUALIZAR,
                service.resolveOperation("PUT", "/api/users/1")
        );
        assertEquals(
                PermissionOperation.ELIMINAR,
                service.resolveOperation("DELETE", "/api/users/1")
        );
    }

    @Test
    void identifiesSubresourcesAndSpanishResources() {
        assertEquals(
                "Sesiones",
                service.resolveResource("/api/users/1/sessions").resource()
        );
        assertEquals(
                "Perfiles",
                service.resolveResource("/api/users/1/profile").resource()
        );
        assertEquals(
                "Torneos",
                service.resolveResource("/api/tournaments").resource()
        );
        assertEquals(
                "Entradas",
                service.resolveResource("/api/tickets").resource()
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
