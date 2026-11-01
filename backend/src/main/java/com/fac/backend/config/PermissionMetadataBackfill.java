package com.fac.backend.config;

import com.fac.backend.entity.Permission;
import com.fac.backend.repository.PermissionRepository;
import com.fac.backend.service.PermissionClassifier;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Migración de datos (no es semilla): rellena module y resource en los
 * permisos que se crearon antes de que existieran esas columnas.
 * Es idempotente: se puede ejecutar en cada arranque.
 */
@Component
@RequiredArgsConstructor
public class PermissionMetadataBackfill {

    private final PermissionRepository permissionRepository;
    private final PermissionClassifier permissionClassifier;

    /**
     * HU-SE-05: los permisos anteriores a las columnas module y resource
     * (y los de esta semilla) quedan en NULL. Se completan con lo que se
     * deduce de la URL; un valor ya escrito nunca se reemplaza.
     */
    @Transactional
    public void run() {
        List<Permission> incomplete = permissionRepository.findAll().stream()
                .filter(p -> isBlank(p.getModule()) || isBlank(p.getResource()))
                .toList();

        incomplete.forEach(permission -> {
            PermissionClassifier.ResourceDescriptor derived =
                    permissionClassifier.resolveResource(permission.getUrl());
            if (isBlank(permission.getModule())) {
                permission.setModule(derived.module());
            }
            if (isBlank(permission.getResource())) {
                permission.setResource(derived.resource());
            }
        });

        if (!incomplete.isEmpty()) {
            permissionRepository.saveAll(incomplete);
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
