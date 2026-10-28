package com.fac.backend.authorization;

import java.util.Set;

public final class SecurityPermissions {

    public static final Set<String> MANAGEMENT_KEYS = Set.of(
            "GET /api/roles",
            "GET /api/permissions",
            "GET /api/permissions/catalog",
            "GET /api/roles/{id}/permissions",
            "GET /api/roles/{id}/summary",
            "PUT /api/roles/{id}/permissions"
    );

    private SecurityPermissions() {
    }
}
