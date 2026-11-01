package com.fac.backend.service;

import com.fac.backend.authorization.PermissionOperation;
import com.fac.backend.dto.permission.PermissionCatalogResponseDTO;
import com.fac.backend.dto.permission.PermissionItemDTO;
import com.fac.backend.entity.Permission;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PermissionClassifierTest {

    private final PermissionClassifier classifier = new PermissionClassifier();

    @Test
    void derivesOperationsFromHttpMethodAndUrl() {
        assertEquals(
                PermissionOperation.LISTAR,
                classifier.resolveOperation("GET", "/api/users")
        );
        assertEquals(
                PermissionOperation.VER,
                classifier.resolveOperation("GET", "/api/users/1")
        );
        assertEquals(
                PermissionOperation.CREAR,
                classifier.resolveOperation("POST", "/api/users")
        );
        assertEquals(
                PermissionOperation.ACTUALIZAR,
                classifier.resolveOperation("PUT", "/api/users/1")
        );
        assertEquals(
                PermissionOperation.ELIMINAR,
                classifier.resolveOperation("DELETE", "/api/users/1")
        );
    }

    @Test
    void identifiesSubresourcesAndSpanishResources() {
        assertEquals(
                "Sesiones",
                classifier.resolveResource("/api/users/1/sessions").resource()
        );
        assertEquals(
                "Perfiles",
                classifier.resolveResource("/api/users/1/profile").resource()
        );
        assertEquals(
                "Torneos",
                classifier.resolveResource("/api/tournaments").resource()
        );
        assertEquals(
                "Entradas",
                classifier.resolveResource("/api/tickets").resource()
        );
    }
}
