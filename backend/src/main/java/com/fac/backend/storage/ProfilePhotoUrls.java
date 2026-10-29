package com.fac.backend.storage;

import java.util.Optional;

/**
 * Traduce entre el nombre del archivo guardado y la URL pública que se
 * almacena en el perfil. Las URL externas (fotos de OAuth) no son locales.
 */
public final class ProfilePhotoUrls {

    public static final String PUBLIC_PATH = "/api/profile/photos/";

    private ProfilePhotoUrls() {
    }

    public static String toUrl(String fileName) {
        return PUBLIC_PATH + fileName;
    }

    public static Optional<String> localFileName(String photoUrl) {
        if (photoUrl == null || !photoUrl.startsWith(PUBLIC_PATH)) {
            return Optional.empty();
        }
        return Optional.of(photoUrl.substring(PUBLIC_PATH.length()));
    }
}
