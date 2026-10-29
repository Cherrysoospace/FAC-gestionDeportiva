package com.fac.backend.controller;

import com.fac.backend.service.ProfilePhotoService;
import com.fac.backend.storage.ProfilePhotoStorage.StoredPhoto;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

/**
 * Sirve las fotos subidas. Es público para poder usarlo en un <img>;
 * los nombres son UUID aleatorios y cada cambio de foto genera uno nuevo.
 */
@RestController
@RequestMapping("/api/profile/photos")
@RequiredArgsConstructor
public class ProfilePhotoController {

    private final ProfilePhotoService profilePhotoService;

    @GetMapping("/{fileName}")
    public ResponseEntity<Resource> get(@PathVariable String fileName) {
        StoredPhoto photo = profilePhotoService.loadPhoto(fileName);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.format().mediaType()))
                .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic())
                .header("X-Content-Type-Options", "nosniff")
                .body(photo.resource());
    }
}
