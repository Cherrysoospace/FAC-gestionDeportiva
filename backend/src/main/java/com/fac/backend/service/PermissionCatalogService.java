package com.fac.backend.service;

import com.fac.backend.authorization.PermissionOperation;
import com.fac.backend.dto.permission.PermissionCatalogResponseDTO;
import com.fac.backend.dto.permission.PermissionItemDTO;
import com.fac.backend.dto.permission.PermissionModuleDTO;
import com.fac.backend.dto.permission.PermissionResourceDTO;
import com.fac.backend.entity.Permission;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;

@Service
public class PermissionCatalogService {

    private static final List<String> MODULE_ORDER = List.of(
            "Administración",
            "Gestión Deportiva",
            "Comercial",
            "Infraestructura",
            "Reportes",
            "Seguridad",
            "Otros"
    );

    private static final List<String> RESOURCE_ORDER = List.of(
            "Usuarios",
            "Roles",
            "Permisos",
            "Asignación de roles",
            "Asignación de permisos",
            "Torneos",
            "Equipos",
            "Jugadores",
            "Partidos",
            "Entradas",
            "Escenarios",
            "Reportes",
            "Perfiles",
            "Sesiones",
            "Autenticación"
    );

    private static final List<PermissionOperation> OPERATION_ORDER = List.of(
            PermissionOperation.VER,
            PermissionOperation.LISTAR,
            PermissionOperation.CREAR,
            PermissionOperation.ACTUALIZAR,
            PermissionOperation.ELIMINAR
    );

    public PermissionCatalogResponseDTO buildCatalog(List<Permission> permissions) {
        List<PermissionItemDTO> items = toItems(permissions);

        List<String> moduleNames = items.stream()
                .map(PermissionItemDTO::getModule)
                .distinct()
                .sorted(Comparator
                        .comparingInt(this::moduleRank)
                        .thenComparing(Comparator.naturalOrder()))
                .toList();

        List<PermissionModuleDTO> modules = moduleNames.stream()
                .map(moduleName -> buildModule(moduleName, items))
                .toList();

        return new PermissionCatalogResponseDTO(modules, items.size());
    }

    public List<PermissionItemDTO> toItems(Collection<Permission> permissions) {
        if (permissions == null) {
            return List.of();
        }

        return permissions.stream()
                .filter(Objects::nonNull)
                .map(this::toItem)
                .sorted(Comparator
                        .comparingInt((PermissionItemDTO item) -> moduleRank(item.getModule()))
                        .thenComparingInt(item -> resourceRank(item.getResource()))
                        .thenComparing(PermissionItemDTO::getModule)
                        .thenComparing(PermissionItemDTO::getResource)
                        .thenComparingInt(item -> operationRank(item.getOperation()))
                        .thenComparing(PermissionItemDTO::getUrl))
                .toList();
    }

    public PermissionItemDTO toItem(Permission permission) {
        ResourceDescriptor descriptor = resolveResource(permission.getUrl());
        PermissionOperation operation = resolveOperation(
                permission.getMethod(),
                permission.getUrl()
        );

        return new PermissionItemDTO(
                permission.getId(),
                permission.getUrl(),
                permission.getMethod().toUpperCase(Locale.ROOT),
                descriptor.module(),
                descriptor.resource(),
                operation,
                operation.getLabel()
        );
    }

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

    private PermissionModuleDTO buildModule(
            String moduleName,
            List<PermissionItemDTO> allItems) {

        List<PermissionItemDTO> moduleItems = allItems.stream()
                .filter(item -> item.getModule().equals(moduleName))
                .toList();

        List<String> resourceNames = moduleItems.stream()
                .map(PermissionItemDTO::getResource)
                .distinct()
                .sorted(Comparator
                        .comparingInt(this::resourceRank)
                        .thenComparing(Comparator.naturalOrder()))
                .toList();

        List<PermissionResourceDTO> resources = resourceNames.stream()
                .map(resourceName -> new PermissionResourceDTO(
                        resourceName,
                        moduleItems.stream()
                                .filter(item -> item.getResource().equals(resourceName))
                                .toList()
                ))
                .toList();

        return new PermissionModuleDTO(moduleName, resources);
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

    private int moduleRank(String module) {
        int index = MODULE_ORDER.indexOf(module);
        return index >= 0 ? index : Integer.MAX_VALUE;
    }

    private int resourceRank(String resource) {
        int index = RESOURCE_ORDER.indexOf(resource);
        return index >= 0 ? index : Integer.MAX_VALUE;
    }

    private int operationRank(PermissionOperation operation) {
        int index = OPERATION_ORDER.indexOf(operation);
        return index >= 0 ? index : Integer.MAX_VALUE;
    }

    public record ResourceDescriptor(String module, String resource) {
    }
}
