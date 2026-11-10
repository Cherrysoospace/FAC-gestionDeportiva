package com.fac.backend.controller;

import com.fac.backend.dto.PermissionValidationRequestDTO;
import com.fac.backend.dto.PermissionValidationResponseDTO;
import com.fac.backend.service.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal/security")
@RequiredArgsConstructor
public class PermissionValidationController {

    private final PermissionService permissionService;

    @PostMapping("/permissions-validation")
    public PermissionValidationResponseDTO validate(
            @Valid @RequestBody PermissionValidationRequestDTO dto,
            JwtAuthenticationToken authentication) {

        Long userId = Long.valueOf(authentication.getToken().getSubject());

        boolean allowed = permissionService.hasPermission(
                userId,
                dto.getMethod(),
                dto.getUrl()
        );

        return new PermissionValidationResponseDTO(allowed);
    }
}
