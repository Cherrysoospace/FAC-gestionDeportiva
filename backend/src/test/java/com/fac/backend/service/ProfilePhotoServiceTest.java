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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.unit.DataSize;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfilePhotoServiceTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};

    @Mock
    private ProfileService profileService;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private ProfilePhotoStorage photoStorage;

    private ProfilePhotoService service;

    private User user;

    @BeforeEach
    void setUp() {
        service = new ProfilePhotoService(
                profileService,
                profileRepository,
                photoStorage,
                new ProfileMapper(),
                new ProfilePhotoProperties("unused", DataSize.ofKilobytes(1))
        );
        user = new User();
        user.setId(5L);
        user.setName("Ana");
        user.setEmail("ana@uc.edu.co");
    }

    @Test
    void uploadStoresImageAndReplacesPreviousLocalPhoto() {
        Profile profile = profileWithPhoto("/api/profile/photos/vieja.png");
        when(profileService.findUser(5L)).thenReturn(user);
        when(profileService.findOrCreateProfile(user)).thenReturn(profile);
        when(photoStorage.store(PNG, PhotoFormat.PNG)).thenReturn("nueva.png");

        MyProfileResponseDTO result = service.uploadMyPhoto(5L, file(PNG));

        assertEquals("/api/profile/photos/nueva.png", result.photoUrl());
        verify(profileRepository).save(profile);
        verify(photoStorage).delete("vieja.png");
    }

    @Test
    void uploadDoesNotTryToDeleteExternalOauthPhoto() {
        Profile profile = profileWithPhoto("https://lh3.googleusercontent.com/foto");
        when(profileService.findUser(5L)).thenReturn(user);
        when(profileService.findOrCreateProfile(user)).thenReturn(profile);
        when(photoStorage.store(PNG, PhotoFormat.PNG)).thenReturn("nueva.png");

        service.uploadMyPhoto(5L, file(PNG));

        verify(photoStorage, never()).delete(anyString());
    }

    @Test
    void uploadRejectsFilesThatAreNotImages() {
        when(profileService.findUser(5L)).thenReturn(user);
        byte[] fakeImage = "<script>alert(1)</script>".getBytes();

        assertInvalid(() -> service.uploadMyPhoto(5L, file(fakeImage)));
        verify(photoStorage, never()).store(any(), any());
    }

    @Test
    void uploadRejectsFilesOverTheSizeLimit() {
        when(profileService.findUser(5L)).thenReturn(user);
        byte[] big = new byte[2048];
        System.arraycopy(PNG, 0, big, 0, PNG.length);

        assertInvalid(() -> service.uploadMyPhoto(5L, file(big)));
    }

    @Test
    void uploadRejectsEmptyFile() {
        when(profileService.findUser(5L)).thenReturn(user);

        assertInvalid(() -> service.uploadMyPhoto(5L, file(new byte[0])));
    }

    @Test
    void removeClearsPhotoAndDeletesLocalFile() {
        Profile profile = profileWithPhoto("/api/profile/photos/vieja.png");
        when(profileService.findUser(5L)).thenReturn(user);
        when(profileRepository.findByUserId(5L)).thenReturn(Optional.of(profile));

        MyProfileResponseDTO result = service.removeMyPhoto(5L);

        assertNull(result.photoUrl());
        verify(photoStorage).delete("vieja.png");
    }

    private void assertInvalid(Runnable action) {
        ApplicationException exception = assertThrows(ApplicationException.class, action::run);
        assertEquals(ErrorCase.INVALID_OPERATION, exception.getErrorCase());
    }

    private Profile profileWithPhoto(String photoUrl) {
        Profile profile = new Profile();
        profile.setUser(user);
        profile.setPhotoUrl(photoUrl);
        return profile;
    }

    private MockMultipartFile file(byte[] content) {
        return new MockMultipartFile("file", "foto.png", "image/png", content);
    }
}
