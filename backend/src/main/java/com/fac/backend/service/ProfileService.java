package com.fac.backend.service;

import com.fac.backend.dto.profile.MyProfileResponseDTO;
import com.fac.backend.dto.profile.ProfileRequestDTO;
import com.fac.backend.dto.profile.ProfileResponseDTO;
import com.fac.backend.entity.Profile;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.ProfileMapper;
import com.fac.backend.repository.ProfileRepository;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.storage.ProfilePhotoStorage;
import com.fac.backend.storage.ProfilePhotoUrls;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * HU-SE-02: datos personales del perfil. Cada usuario tiene como máximo un perfil.
 * Los métodos "My" los usa el propio usuario; el resto, el administrador.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ProfileService {

    private final ProfileRepository profileRepository;

    private final UserRepository userRepository;

    private final ProfileMapper profileMapper;

    private final ProfilePhotoStorage photoStorage;

    @Transactional(readOnly = true)
    public MyProfileResponseDTO getMyProfile(Long userId) {
        User user = findUser(userId);
        Profile profile = profileRepository.findByUserId(userId).orElse(null);

        return profileMapper.toMyProfileDTO(user, profile);
    }

    public MyProfileResponseDTO updateMyProfile(Long userId, ProfileRequestDTO dto) {
        User user = findUser(userId);
        Profile profile = findOrCreateProfile(user);
        profileMapper.updateEntity(dto, profile);
        profileRepository.save(profile);

        return profileMapper.toMyProfileDTO(user, profile);
    }

    public ProfileResponseDTO create(Long userId, ProfileRequestDTO dto) {
        User user = findUser(userId);

        if (profileRepository.existsByUserId(user.getId())) {
            throw new ApplicationException(
                    ErrorCase.ALREADY_EXISTS,
                    "El usuario ya tiene un perfil registrado"
            );
        }

        Profile profile = profileMapper.toEntity(dto);
        profile.setUser(user);
        Profile savedProfile = profileRepository.save(profile);

        return profileMapper.toResponseDTO(savedProfile);
    }

    @Transactional(readOnly = true)
    public ProfileResponseDTO findByUserId(Long userId) {
        return profileMapper.toResponseDTO(findProfile(userId));
    }

    public ProfileResponseDTO update(Long userId, ProfileRequestDTO dto) {
        Profile profile = findProfile(userId);
        profileMapper.updateEntity(dto, profile);

        return profileMapper.toResponseDTO(profileRepository.save(profile));
    }

    public void delete(Long userId) {
        Profile profile = findProfile(userId);
        ProfilePhotoUrls.localFileName(profile.getPhotoUrl())
                .ifPresent(photoStorage::delete);
        profileRepository.delete(profile);
    }

    Profile findOrCreateProfile(User user) {
        return profileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Profile profile = new Profile();
                    profile.setUser(user);
                    return profile;
                });
    }

    User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND,
                        "Usuario no encontrado con id: " + id
                ));
    }

    private Profile findProfile(Long userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND,
                        "Perfil del usuario no encontrado con id: " + userId
                ));
    }
}
