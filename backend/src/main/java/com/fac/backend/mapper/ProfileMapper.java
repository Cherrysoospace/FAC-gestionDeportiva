package com.fac.backend.mapper;

import java.util.List;

import com.fac.backend.dto.profile.MyProfileResponseDTO;
import com.fac.backend.dto.profile.ProfileRequestDTO;
import com.fac.backend.dto.profile.ProfileResponseDTO;
import com.fac.backend.entity.Profile;
import com.fac.backend.entity.User;
import org.springframework.stereotype.Component;

@Component
public class ProfileMapper {

    public Profile toEntity(ProfileRequestDTO dto) {
        return Profile.builder()
                .phone(blankToNull(dto.getPhone()))
                .birthDate(dto.getBirthDate())
                .build();
    }

    public void updateEntity(ProfileRequestDTO dto, Profile profile) {
        profile.setPhone(blankToNull(dto.getPhone()));
        profile.setBirthDate(dto.getBirthDate());
    }

    public ProfileResponseDTO toResponseDTO(Profile profile) {
        if (profile == null) {
            return null;
        }

        return new ProfileResponseDTO(
                profile.getId(),
                profile.getPhone(),
                profile.getBirthDate(),
                profile.getPhotoUrl()
        );
    }

    public MyProfileResponseDTO toMyProfileDTO(User user, Profile profile) {
        return new MyProfileResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getAuthProvider(),
                profile == null ? null : profile.getPhone(),
                profile == null ? null : profile.getBirthDate(),
                profile == null ? null : profile.getPhotoUrl()
        );
    }

    public List<ProfileResponseDTO> toResponseDTOList(List<Profile> profiles) {
        return profiles.stream()
                .map(this::toResponseDTO)
                .toList();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
