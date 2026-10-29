package com.fac.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;

/**
 * Configuración de las fotos de perfil (prefijo app.profile-photos).
 *
 * @param directory carpeta donde se guardan los archivos subidos
 * @param maxSize   tamaño máximo permitido por foto
 */
@ConfigurationProperties(prefix = "app.profile-photos")
public record ProfilePhotoProperties(
        String directory,
        DataSize maxSize) {

    public ProfilePhotoProperties {
        if (directory == null || directory.isBlank()) {
            directory = "uploads/profile-photos";
        }
        if (maxSize == null) {
            maxSize = DataSize.ofMegabytes(2);
        }
    }
}
