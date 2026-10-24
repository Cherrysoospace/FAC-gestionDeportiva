package com.fac.backend.service;

import com.fac.backend.dto.profile.ProfileRequestDTO;
import com.fac.backend.dto.profile.ProfileResponseDTO;
import com.fac.backend.entity.Profile;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.ProfileMapper;
import com.fac.backend.repository.ProfileRepository;
import com.fac.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ProfileService {

    private final ProfileRepository profileRepository;

    private final UserRepository userRepository;

    private final ProfileMapper profileMapper;

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

    @Transactional
    public ProfileResponseDTO findByUserId(Long userId) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ApplicationException(
                    ErrorCase.NOT_FOUND,
                    "Perfil del usuario no encontrado con id: " + userId
                ));

        return profileMapper.toResponseDTO(profile);
    }

    public ProfileResponseDTO update(Long userId, ProfileRequestDTO dto) {
        Profile profile = findProfile(userId);
        profileMapper.updateEntity(dto, profile);

        return profileMapper.toResponseDTO(profileRepository.save(profile));
    }

    public void delete(Long userId) {
        profileRepository.delete(findProfile(userId));
    }

    private Profile findProfile(Long id) {
        return profileRepository.findByUserId(id)
                .orElseThrow(() -> new ApplicationException(
                    ErrorCase.NOT_FOUND,
                    "Perfil no encontrado con id: " + id
                ));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApplicationException(
                    ErrorCase.NOT_FOUND,
                    "Usuario no encontrado con id: " + id
                ));
    }
}