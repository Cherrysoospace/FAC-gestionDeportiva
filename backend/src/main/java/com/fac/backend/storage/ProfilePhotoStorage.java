package com.fac.backend.storage;

import org.springframework.core.io.Resource;

import java.util.Optional;

/**
 * Dónde se guardan físicamente las fotos de perfil. Los servicios dependen
 * de esta interfaz, así se puede cambiar el disco local por otro almacenamiento.
 */
public interface ProfilePhotoStorage {

    /** Guarda la imagen y devuelve el nombre de archivo generado. */
    String store(byte[] content, PhotoFormat format);

    Optional<StoredPhoto> load(String fileName);

    void delete(String fileName);

    record StoredPhoto(Resource resource, PhotoFormat format) {
    }
}
