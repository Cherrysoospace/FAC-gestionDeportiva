package com.fac.backend.service;

import com.fac.backend.authorization.PermissionOperation;
import java.util.Locale;
import java.util.stream.Stream;
import org.springframework.stereotype.Component;

/**
 * Deduce a qué módulo, recurso y operación pertenece un permiso a partir de
 * su URL y método HTTP (HU-SE-05). Cuando se agreguen módulos nuevos
 * (torneos, equipos...) solo cambia esta clase, no la matriz.
 */
@Component
public class PermissionClassifier {

    public PermissionOperation resolveOperation(String method, String url) {
        String normalizedMethod = method == null
                ? ""
                : method.toUpperCase(Locale.ROOT);

        boolean hasIdentifier = hasIdentifier(url);

        return switch (normalizedMethod) {
            case "GET" -> hasIdentifier
                    ? PermissionOperation.VER
                    : PermissionOperation.LISTAR;
            case "POST" -> PermissionOperation.CREAR;
            case "PUT", "PATCH" -> PermissionOperation.ACTUALIZAR;
            case "DELETE" -> PermissionOperation.ELIMINAR;
            default -> hasIdentifier
                    ? PermissionOperation.VER
                    : PermissionOperation.LISTAR;
        };
    }

    public ResourceDescriptor resolveResource(String url) {
        String path = url == null ? "" : url;
        if (path.startsWith("/api/")) {
            path = path.substring(5);
        }

        String[] segments = path.split("/");
        String root = segments.length > 0 ? segments[0] : "";
        String third = segments.length > 2 ? segments[2] : "";

        if ("users".equals(root)) {
            if ("sessions".equals(third)) {
                return new ResourceDescriptor("Seguridad", "Sesiones");
            }
            if ("profile".equals(third)) {
                return new ResourceDescriptor("Administración", "Perfiles");
            }
        }

        return switch (root) {
            case "users" -> new ResourceDescriptor("Administración", "Usuarios");
            case "roles" -> new ResourceDescriptor("Administración", "Roles");
            case "permissions" -> new ResourceDescriptor("Administración", "Permisos");
            case "role-permissions" ->
                    new ResourceDescriptor("Administración", "Asignación de permisos");
            case "user-roles" ->
                    new ResourceDescriptor("Administración", "Asignación de roles");
            case "auth" -> new ResourceDescriptor("Seguridad", "Autenticación");
            case "tournaments", "torneos" ->
                    new ResourceDescriptor("Gestión Deportiva", "Torneos");
            case "teams", "equipos" ->
                    new ResourceDescriptor("Gestión Deportiva", "Equipos");
            case "players", "jugadores" ->
                    new ResourceDescriptor("Gestión Deportiva", "Jugadores");
            case "matches", "partidos" ->
                    new ResourceDescriptor("Gestión Deportiva", "Partidos");
            case "tickets", "entradas" ->
                    new ResourceDescriptor("Comercial", "Entradas");
            case "venues", "escenarios" ->
                    new ResourceDescriptor("Infraestructura", "Escenarios");
            case "reports", "reportes" ->
                    new ResourceDescriptor("Reportes", "Reportes");
            default -> new ResourceDescriptor("Otros", humanize(root));
        };
    }

    private boolean hasIdentifier(String url) {
        if (url == null) {
            return false;
        }

        return Stream.of(url.split("/"))
                .anyMatch(segment -> segment.equals("{id}")
                        || segment.matches("\\d+")
                        || segment.matches("[a-fA-F0-9]{24}"));
    }

    private String humanize(String value) {
        if (value == null || value.isBlank()) {
            return "General";
        }

        String cleaned = value.replace('-', ' ').replace('_', ' ').trim();
        return Character.toUpperCase(cleaned.charAt(0)) + cleaned.substring(1);
    }

    public record ResourceDescriptor(String module, String resource) {
    }
}
