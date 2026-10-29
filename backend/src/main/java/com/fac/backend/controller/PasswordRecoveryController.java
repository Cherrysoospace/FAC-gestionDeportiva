package com.fac.backend.controller;

import com.fac.backend.dto.common.MessageResponseDTO;
import com.fac.backend.dto.password.ForgotPasswordRequestDTO;
import com.fac.backend.dto.password.ResetPasswordRequestDTO;
import com.fac.backend.service.PasswordRecoveryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/password")
@RequiredArgsConstructor
public class PasswordRecoveryController {

    private static final String FORGOT_MESSAGE =
            "Si el correo está registrado, recibirás un mensaje con las "
                    + "instrucciones para recuperar el acceso.";

    private final PasswordRecoveryService passwordRecoveryService;

    @PostMapping("/forgot")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public MessageResponseDTO forgot(
            @Valid @RequestBody ForgotPasswordRequestDTO dto) {
        passwordRecoveryService.requestReset(dto.getEmail());
        return new MessageResponseDTO(FORGOT_MESSAGE);
    }

    @GetMapping("/reset/validate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void validate(@RequestParam String token) {
        passwordRecoveryService.validateToken(token);
    }

    @PostMapping("/reset")
    public MessageResponseDTO reset(
            @Valid @RequestBody ResetPasswordRequestDTO dto) {
        passwordRecoveryService.resetPassword(dto.getToken(), dto.getNewPassword());
        return new MessageResponseDTO(
                "Tu contraseña se actualizó. Ya puedes iniciar sesión."
        );
    }
}
