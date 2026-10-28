package com.fac.backend.authorization;

import com.fac.backend.entity.Permission;

public final class PermissionMatcher {

    private PermissionMatcher() {
    }

    public static String normalizeUrl(String requestUrl) {
        if (requestUrl == null) {
            return "";
        }

        String normalized = requestUrl.replaceAll(
                "(?i)(?<=/)(?:\\d+|[a-f0-9]{24})(?=/|$)",
                "{id}"
        );

        if (normalized.length() > 1 && normalized.endsWith("/")) {
            return normalized.substring(0, normalized.length() - 1);
        }

        return normalized;
    }

    public static String key(String method, String url) {
        return (method == null ? "" : method.toUpperCase()) + " " + normalizeUrl(url);
    }

    public static String key(Permission permission) {
        return key(permission.getMethod(), permission.getUrl());
    }

    public static boolean matches(
            Permission permission,
            String httpMethod,
            String requestUrl) {

        return permission.getMethod().equalsIgnoreCase(httpMethod)
                && normalizeUrl(permission.getUrl()).equals(normalizeUrl(requestUrl));
    }
}
