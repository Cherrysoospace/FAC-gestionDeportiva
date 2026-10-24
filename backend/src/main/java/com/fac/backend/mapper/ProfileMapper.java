package com.fac.backend.mapper;

import java.util.List;

import com.fac.backend.dto.profile.ProfileRequestDTO;
import com.fac.backend.dto.profile.ProfileResponseDTO;
import com.fac.backend.entity.Profile;
import org.springframework.stereotype.Component;

@Component
public class ProfileMapper {

    public Profile toEntity(ProfileRequestDTO dto) {
        return Profile.builder()
                .phone(dto.getPhone())
                .birthDate(dto.getBirthDate())
                .build();
    }

    public void updateEntity(ProfileRequestDTO dto, Profile profile) {
        profile.setPhone(dto.getPhone());
        profile.setBirthDate(dto.getBirthDate());
    }

    public ProfileResponseDTO toResponseDTO(Profile profile) {
        if (profile == null) {
            return null;
        }
        
        return new ProfileResponseDTO(
                profile.getId(),
                profile.getPhone(),
                profile.getBirthDate()
        );
    }

    public List<ProfileResponseDTO> toResponseDTOList(List<Profile> profiles) {
        return profiles.stream()
                .map(this::toResponseDTO)
                .toList();
    }
}