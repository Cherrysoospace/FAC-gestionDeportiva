package com.fac.backend.service;

import com.fac.backend.config.ProfilePhotoProperties;
import com.fac.backend.dto.profile.MyProfileResponseDTO;
import com.fac.backend.entity.Profile;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.ProfileMapper;
import com.fac.backend.repository.ProfileRepository;
import com.fac.backend.storage.PhotoFormat;
import com.fac.backend.storage.ProfilePhotoStorage;
import com.fac.backend.storage.ProfilePhotoStorage.StoredPhoto;
import com.fac.backend.storage.ProfilePhotoUrls;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * HU-SE-02: foto del perfil. Valida la imagen, la guarda y reemplaza la anterior.
 */
@Service
@RequiredArgsConstructor
public class ProfilePhotoService {

    private final ProfileService profileService;
    private final ProfileRepository profileRepository;
    private final ProfilePhotoStorage photoStorage;
    private final ProfileMapper profileMapper;
    private final ProfilePhotoProperties properties;

    @Transactional
    public MyProfileResponseDTO uploadMyPhoto(Long userId, MultipartFile file) {
        User user = profileService.findUser(userId);
        byte[] content = readValidImage(file);
        PhotoFormat format = PhotoFormat.detect(content)
                .orElseThrow(() -> invalid("La foto debe ser una imagen JPG, PNG o WebP"));

        Profile profile = profileService.findOrCreateProfile(user);
        String previousUrl = profile.getPhotoUrl();

        profile.setPhotoUrl(ProfilePhotoUrls.toUrl(photoStorage.store(content, format)));
        profileRepository.save(profile);
        discardLocalPhoto(previousUrl);

        return profileMapper.toMyProfileDTO(user, profile);
    }

    @Transactional
    public MyProfileResponseDTO removeMyPhoto(Long userId) {
        User user = profileService.findUser(userId);
        Profile profile = profileRepository.findByUserId(userId).orElse(null);

        if (profile != null && profile.getPhotoUrl() != null) {
            discardLocalPhoto(profile.getPhotoUrl());
            profile.setPhotoUrl(null);
            profileRepository.save(profile);
        }

        return profileMapper.toMyProfileDTO(user, profile);
    }

    public StoredPhoto loadPhoto(String fileName) {
        return photoStorage.load(fileName)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND,
                        "Foto no encontrada"
                ));
    }

    private byte[] readValidImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw invalid("Selecciona una foto");
        }
        if (file.getSize() > properties.maxSize().toBytes()) {
            throw invalid("La foto no puede superar " + properties.maxSize().toMegabytes() + " MB");
        }
        try {
            return file.getBytes();
        } catch (IOException exception) {
            throw invalid("No se pudo leer la foto");
        }
    }

    private void discardLocalPhoto(String photoUrl) {
        ProfilePhotoUrls.localFileName(photoUrl).ifPresent(photoStorage::delete);
    }

    private ApplicationException invalid(String message) {
        return new ApplicationException(ErrorCase.INVALID_OPERATION, message);
    }
}
