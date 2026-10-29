package com.fac.backend.storage;

import com.fac.backend.config.ProfilePhotoProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Guarda las fotos en una carpeta del servidor con nombres aleatorios (UUID).
 */
@Component
public class LocalProfilePhotoStorage implements ProfilePhotoStorage {

    private static final Logger logger = LoggerFactory.getLogger(LocalProfilePhotoStorage.class);

    // Solo nombres generados por store(): evita leer o borrar rutas arbitrarias (../)
    private static final Pattern FILE_NAME = Pattern.compile(
            "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.([a-z]+)$"
    );

    private final Path directory;

    public LocalProfilePhotoStorage(ProfilePhotoProperties properties) {
        this.directory = Path.of(properties.directory()).toAbsolutePath().normalize();
    }

    @Override
    public String store(byte[] content, PhotoFormat format) {
        String fileName = UUID.randomUUID() + "." + format.extension();
        try {
            Files.createDirectories(directory);
            Files.write(directory.resolve(fileName), content);
            return fileName;
        } catch (IOException exception) {
            throw new UncheckedIOException("No se pudo guardar la foto de perfil", exception);
        }
    }

    @Override
    public Optional<StoredPhoto> load(String fileName) {
        return formatOf(fileName)
                .map(format -> new StoredPhoto(
                        new FileSystemResource(directory.resolve(fileName)),
                        format
                ))
                .filter(photo -> photo.resource().exists());
    }

    @Override
    public void delete(String fileName) {
        if (formatOf(fileName).isEmpty()) {
            return;
        }
        try {
            Files.deleteIfExists(directory.resolve(fileName));
        } catch (IOException exception) {
            // Un archivo huérfano no debe impedir que el usuario cambie su foto
            logger.warn("No se pudo borrar la foto {}", fileName, exception);
        }
    }

    private Optional<PhotoFormat> formatOf(String fileName) {
        if (fileName == null) {
            return Optional.empty();
        }
        Matcher matcher = FILE_NAME.matcher(fileName);
        return matcher.matches()
                ? PhotoFormat.fromExtension(matcher.group(1))
                : Optional.empty();
    }
}
