package com.fac.backend.controller;

import com.fac.backend.dto.AuthResponseDTO;
import com.fac.backend.dto.DiscordOAuthRequestDTO;
import com.fac.backend.dto.LoginRequestDTO;
import com.fac.backend.dto.LoginResponseDTO;
import com.fac.backend.dto.MeResponseDTO;
import com.fac.backend.dto.OAuthRequestDTO;
import com.fac.backend.dto.RegisterRequestDTO;
import com.fac.backend.dto.user.UserResponseDTO;
import com.fac.backend.security.DiscordOAuthClient;
import com.fac.backend.service.AuthService;
import com.fac.backend.service.CurrentUserService;
import com.fac.backend.service.OAuthLoginService;
import com.fac.backend.service.RegistrationService;
import com.fac.backend.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RegistrationService registrationService;
    private final OAuthLoginService oauthLoginService;
    private final SessionService sessionService;
    private final CurrentUserService currentUserService;

    @PostMapping("/login")
    public LoginResponseDTO login(@Valid @RequestBody LoginRequestDTO dto) {
        return authService.login(dto);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponseDTO register(
            @Valid @RequestBody RegisterRequestDTO dto) {
        return registrationService.register(dto);
    }

    @PostMapping("/oauth/firebase")
    public AuthResponseDTO loginWithFirebase(
            @Valid @RequestBody OAuthRequestDTO dto) {
        return oauthLoginService.loginWithIdToken(dto.getIdToken());
    }

    @PostMapping("/oauth/discord")
    public AuthResponseDTO loginWithDiscord(
            @Valid @RequestBody DiscordOAuthRequestDTO dto) {
        return oauthLoginService.loginWithAuthorizationCode(
                DiscordOAuthClient.PROVIDER_ID,
                dto.getCode(),
                dto.getRedirectUri()
        );
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@AuthenticationPrincipal Jwt jwt) {
        sessionService.invalidate(jwt.getId());
    }

    @GetMapping("/me")
    public MeResponseDTO me(@AuthenticationPrincipal Jwt jwt) {
        return currentUserService.me(Long.valueOf(jwt.getSubject()));
    }
}
