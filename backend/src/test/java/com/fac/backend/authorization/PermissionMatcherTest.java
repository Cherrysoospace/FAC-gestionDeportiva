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
    void matchesPutAndPatchRoutesWithFixedSuffixAfterDynamicId() {
        Permission matchResult = Permission.builder()
                .id(10L)
                .method("PUT")
                .url("/gestion-deportiva/matches/{id}/result")
                .build();
        Permission voidBet = Permission.builder()
                .id(11L)
                .method("PATCH")
                .url("/gestion-deportiva/bets/{id}/void")
                .build();
        Permission cancelMyBet = Permission.builder()
                .id(12L)
                .method("PATCH")
                .url("/gestion-deportiva/me/bets/{id}/cancel")
                .build();

        assertEquals(
                "/gestion-deportiva/matches/{id}/result",
                PermissionMatcher.normalizeUrl("/gestion-deportiva/matches/15/result")
        );
        assertEquals(
                "/gestion-deportiva/bets/{id}/void",
                PermissionMatcher.normalizeUrl("/gestion-deportiva/bets/42/void")
        );
        assertEquals(
                "/gestion-deportiva/me/bets/{id}/cancel",
                PermissionMatcher.normalizeUrl("/gestion-deportiva/me/bets/42/cancel")
        );

        assertTrue(PermissionMatcher.matches(matchResult, "PUT", "/gestion-deportiva/matches/15/result"));
        assertTrue(PermissionMatcher.matches(voidBet, "PATCH", "/gestion-deportiva/bets/42/void"));
        assertTrue(PermissionMatcher.matches(cancelMyBet, "patch", "/gestion-deportiva/me/bets/42/cancel/"));
        assertFalse(PermissionMatcher.matches(matchResult, "PATCH", "/gestion-deportiva/matches/15/result"));
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

