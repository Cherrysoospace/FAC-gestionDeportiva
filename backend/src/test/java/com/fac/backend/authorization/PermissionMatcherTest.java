package com.fac.backend.authorization;

import com.fac.backend.entity.Permission;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PermissionMatcherTest {

    @Test
    void matchesNumericSegmentAgainstQuestionMarkAndIdPlaceholder() {
        Permission questionMarkPermission = Permission.builder()
                .id(1L)
                .method("GET")
                .url("/api/roles/?")
                .build();
        Permission idPlaceholderPermission = Permission.builder()
                .id(2L)
                .method("GET")
                .url("/api/roles/{id}")
                .build();

        assertTrue(PermissionMatcher.matches(questionMarkPermission, "GET", "/api/roles/15"));
        assertTrue(PermissionMatcher.matches(idPlaceholderPermission, "GET", "/api/roles/15"));
        assertTrue(PermissionMatcher.matches(questionMarkPermission, "get", "/api/roles/15/"));
    }

    @Test
    void rejectsNonNumericSegmentAgainstParameterizedRoute() {
        Permission questionMarkPermission = Permission.builder()
                .id(1L)
                .method("GET")
                .url("/api/roles/?")
                .build();
        Permission idPlaceholderPermission = Permission.builder()
                .id(2L)
                .method("GET")
                .url("/api/roles/{id}")
                .build();

        assertFalse(PermissionMatcher.matches(questionMarkPermission, "GET", "/api/roles/abc"));
        assertFalse(PermissionMatcher.matches(idPlaceholderPermission, "GET", "/api/roles/abc"));
    }

    @Test
    void normalizesMultipleDynamicIdsAndHexObjectIds() {
        assertEquals(
                "/api/user-roles/{id}/{id}",
                PermissionMatcher.normalizeUrl("/api/user-roles/10/25")
        );
        assertEquals(
                "/api/roles/{id}",
                PermissionMatcher.normalizeUrl("/api/roles/507f1f77bcf86cd799439011/")
        );
        assertEquals(
                "DELETE /api/user-roles/{id}/{id}",
                PermissionMatcher.key("delete", "/api/user-roles/10/25")
        );
    }

    @Test
    void handlesNullInputsSafely() {
        Permission permission = Permission.builder()
                .id(1L)
                .method("GET")
                .url("/api/roles")
                .build();

        assertFalse(PermissionMatcher.matches(null, "GET", "/api/roles"));
        assertFalse(PermissionMatcher.matches(permission, null, "/api/roles"));
        assertFalse(PermissionMatcher.matches(permission, "GET", null));
        assertEquals("", PermissionMatcher.normalizeUrl(null));
    }
}

