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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Arma el catálogo de permisos que se muestra en la matriz (HU-SE-06):
 * agrupa por módulo y recurso y ordena. Cómo se clasifica cada URL lo decide
 * {@link PermissionClassifier}; esta clase solo se ocupa de la presentación.
 */
@Service
@RequiredArgsConstructor
public class PermissionCatalogService {

    private final PermissionClassifier classifier;


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
        // Lo guardado en el permiso manda; la URL solo cubre permisos antiguos
        PermissionClassifier.ResourceDescriptor derived =
                classifier.resolveResource(permission.getUrl());
        PermissionOperation operation = classifier.resolveOperation(
                permission.getMethod(),
                permission.getUrl()
        );

        return new PermissionItemDTO(
                permission.getId(),
                permission.getUrl(),
                permission.getMethod().toUpperCase(Locale.ROOT),
                storedOrDerived(permission.getModule(), derived.module()),
                storedOrDerived(permission.getResource(), derived.resource()),
                operation,
                operation.getLabel()
        );
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

    private String storedOrDerived(String stored, String derived) {
        return stored == null || stored.isBlank() ? derived : stored;
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

}
