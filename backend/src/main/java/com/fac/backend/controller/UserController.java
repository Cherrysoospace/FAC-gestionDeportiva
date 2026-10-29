package com.fac.backend.controller;

import com.fac.backend.dto.user.CreateUserDTO;
import com.fac.backend.dto.user.UpdateUserDTO;
import com.fac.backend.dto.user.UpdateUserStatusDTO;
import com.fac.backend.dto.user.UserDetailResponseDTO;
import com.fac.backend.dto.user.UserResponseDTO;
import com.fac.backend.dto.user.UserSessionsResponseDTO;
import com.fac.backend.dto.user.UserRolesResponseDTO;
import com.fac.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponseDTO create(@Valid @RequestBody CreateUserDTO dto) {
        return userService.create(dto);
    }

    @GetMapping
    public List<UserResponseDTO> findAll() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public UserResponseDTO findById(@PathVariable Long id) {
        return userService.findById(id);
    }

    @GetMapping("/{id}/detail")
    public UserDetailResponseDTO findByIdAndProfile(@PathVariable Long id) {
        return userService.findByIdWithProfile(id);
    }

    @GetMapping("/{id}/detail-with-sessions")
    public UserSessionsResponseDTO findByIdAndSessions(@PathVariable Long id) {
        return userService.findByIdAndSessions(id);
    }

    @GetMapping("/{id}/detail-with-roles")
    public UserRolesResponseDTO findByIdAndRoles(@PathVariable Long id) {
        return userService.findByIdAndRoles(id);
    }

    @PutMapping("/{id}")
    public UserResponseDTO update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserDTO dto) {
        return userService.update(id, dto);
    }

    @PatchMapping("/{id}/status")
    public UserResponseDTO changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusDTO dto,
            @AuthenticationPrincipal Jwt jwt) {
        return userService.changeStatus(id, dto.getEnabled(), actorId(jwt));
    }

    // Desactiva el usuario (no lo borra de la base de datos).
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        userService.delete(id, actorId(jwt));
    }

    private Long actorId(Jwt jwt) {
        return jwt == null ? null : Long.valueOf(jwt.getSubject());
    }
}
