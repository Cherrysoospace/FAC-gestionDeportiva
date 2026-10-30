package com.fac.backend.controller;

import com.fac.backend.dto.twofactor.TwoFactorStatusDTO;
import com.fac.backend.dto.twofactor.UpdateTwoFactorRequestDTO;
import com.fac.backend.service.TwoFactorSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 2FA del usuario autenticado. Vive bajo /api/profile/me, así que cada
 * persona solo puede cambiar el suyo (el id sale del token).
 */
@RestController
@RequestMapping("/api/profile/me/two-factor")
@RequiredArgsConstructor
public class TwoFactorSettingsController {

    private final TwoFactorSettingsService twoFactorSettingsService;

    @GetMapping
    public TwoFactorStatusDTO get(@AuthenticationPrincipal Jwt jwt) {
        return twoFactorSettingsService.getStatus(userId(jwt));
    }

    @PutMapping
    public TwoFactorStatusDTO update(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateTwoFactorRequestDTO dto) {
        return twoFactorSettingsService.update(
                userId(jwt),
                dto.getEnabled(),
                dto.getCurrentPassword()
        );
    }

    private Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
