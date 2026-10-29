package com.fac.backend.controller;

import com.fac.backend.dto.profile.MyProfileResponseDTO;
import com.fac.backend.dto.profile.ProfileRequestDTO;
import com.fac.backend.service.ProfilePhotoService;
import com.fac.backend.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Perfil del usuario autenticado. El id sale del token, nunca de la URL,
 * así que cada persona solo puede ver y modificar su propio perfil.
 */
@RestController
@RequestMapping("/api/profile/me")
@RequiredArgsConstructor
public class MyProfileController {

    private final ProfileService profileService;
    private final ProfilePhotoService profilePhotoService;

    @GetMapping
    public MyProfileResponseDTO get(@AuthenticationPrincipal Jwt jwt) {
        return profileService.getMyProfile(userId(jwt));
    }

    @PutMapping
    public MyProfileResponseDTO update(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ProfileRequestDTO dto) {
        return profileService.updateMyProfile(userId(jwt), dto);
    }

    @PutMapping(path = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MyProfileResponseDTO uploadPhoto(
            @AuthenticationPrincipal Jwt jwt,
            @RequestPart("file") MultipartFile file) {
        return profilePhotoService.uploadMyPhoto(userId(jwt), file);
    }

    @DeleteMapping("/photo")
    public MyProfileResponseDTO removePhoto(@AuthenticationPrincipal Jwt jwt) {
        return profilePhotoService.removeMyPhoto(userId(jwt));
    }

    private Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
