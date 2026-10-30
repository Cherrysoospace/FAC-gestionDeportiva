package com.fac.backend.controller;

import com.fac.backend.dto.AuthResponseDTO;
import com.fac.backend.dto.twofactor.TwoFactorChallengeDTO;
import com.fac.backend.dto.twofactor.TwoFactorChallengeRequestDTO;
import com.fac.backend.dto.twofactor.TwoFactorVerifyRequestDTO;
import com.fac.backend.service.AuthService;
import com.fac.backend.service.TwoFactorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Segundo paso del login con correo y contraseña (HU-SE-10).
 * Son rutas públicas: quien llama todavía no tiene token, solo el reto.
 */
@RestController
@RequestMapping("/api/auth/2fa")
@RequiredArgsConstructor
public class TwoFactorController {

    private final AuthService authService;
    private final TwoFactorService twoFactorService;

    @PostMapping("/verify")
    public AuthResponseDTO verify(@Valid @RequestBody TwoFactorVerifyRequestDTO dto) {
        return authService.completeTwoFactorLogin(dto.getChallengeId(), dto.getCode());
    }

    @PostMapping("/resend")
    public TwoFactorChallengeDTO resend(@Valid @RequestBody TwoFactorChallengeRequestDTO dto) {
        return twoFactorService.resend(dto.getChallengeId());
    }

    @PostMapping("/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@Valid @RequestBody TwoFactorChallengeRequestDTO dto) {
        twoFactorService.cancel(dto.getChallengeId());
    }
}
