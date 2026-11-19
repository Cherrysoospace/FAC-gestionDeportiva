package com.fac.backend.config;

import java.util.Locale;

/**
 * Permiso que la semilla garantiza en la base de datos.
 * module y resource en null = los deduce PermissionMetadataBackfill a partir de la URL.
 */
record PermissionSeed(String method, String url, String module, String resource) {

    PermissionSeed(String method, String url) {
        this(method, url, null, null);
    }

    String key() {
        return keyOf(method, url);
    }

    static String keyOf(String method, String url) {
        return method.toUpperCase(Locale.ROOT) + " " + url;
    }
}
