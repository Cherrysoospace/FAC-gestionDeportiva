package com.fac.backend.service;

import com.fac.backend.dto.AuthResponseDTO;
import com.fac.backend.dto.LoginRequestDTO;
import com.fac.backend.dto.MeResponseDTO;
import com.fac.backend.dto.RegisterRequestDTO;
import com.fac.backend.dto.role.RoleResponseDTO;
import com.fac.backend.dto.user.UserResponseDTO;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.RoleMapper;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.security.DiscordOAuthClient;
import com.fac.backend.security.FirebaseIdentity;
import com.fac.backend.security.FirebaseTokenVerifier;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SessionService sessionService;
    private final UserService userService;
    private final FirebaseTokenVerifier firebaseTokenVerifier;
    private final DiscordOAuthClient discordOAuthClient;
    private final EffectivePermissionService effectivePermissionService;
    private final PermissionCatalogService permissionCatalogService;
    private final RoleMapper roleMapper;

    @Transactional
    public AuthResponseDTO login(LoginRequestDTO dto) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(dto.getEmail()))
                .orElseThrow(this::unauthorized);

        if (user.getPassword() == null
                || user.getPassword().isBlank()
                || !passwordEncoder.matches(
                        dto.getPassword(),
                        user.getPassword()
                )) {
            throw unauthorized();
        }

        ensureEnabled(user);

        return issueSession(user);
    }

    @Transactional
    public UserResponseDTO register(RegisterRequestDTO dto) {
        String email = normalizeEmail(dto.getEmail());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApplicationException(
                    ErrorCase.ALREADY_EXISTS,
                    "Ya existe una cuenta con ese correo"
            );
        }

        User user = new User();
        user.setName(dto.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setAuthProvider(User.LOCAL_AUTH_PROVIDER);
        user.setEnabled(true);

        User savedUser = userRepository.save(user);
        userService.assignDefaultRoleIfPresent(savedUser);
        return new UserResponseDTO(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail()
        );
    }

    @Transactional
    public AuthResponseDTO loginWithFirebase(String idToken) {
        FirebaseIdentity identity = firebaseTokenVerifier.verify(idToken);

        User user = userService.resolverUsuario(
                identity.provider(),
                identity.uid(),
                identity.email(),
                identity.name(),
                identity.picture()
        );

        ensureEnabled(user);

        return issueSession(user);
    }

    @Transactional
    public AuthResponseDTO loginWithDiscord(String code, String redirectUri) {
        FirebaseIdentity identity =
                discordOAuthClient.authenticate(code, redirectUri);

        User user = userService.resolverUsuario(
                identity.provider(),
                identity.uid(),
                identity.email(),
                identity.name(),
                identity.picture()
        );

        ensureEnabled(user);

        return issueSession(user);
    }

    public AuthResponseDTO issueSession(User user) {
        JwtService.IssuedToken issued = jwtService.generateToken(user);

        sessionService.registerAuthenticatedSession(
                user,
                issued.jti(),
                issued.expiresAt()
        );

        return issued.response();
    }

    @Transactional
    public void logout(String jti) {
        sessionService.invalidate(jti);
    }

    @Transactional(readOnly = true)
    public MeResponseDTO me(Long userId) {
        User user = userRepository.findWithRolesById(userId)
                .orElseThrow(() -> new ApplicationException(
                        ErrorCase.NOT_FOUND,
                        "Usuario no encontrado con id: " + userId
                ));

        List<RoleResponseDTO> roles = user.getUserRoles().stream()
                .map(userRole -> roleMapper.toResponseDTO(userRole.getRole()))
                .toList();

        return new MeResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                roles,
                permissionCatalogService.toItems(
                        effectivePermissionService.findByUserId(userId)
                )
        );
    }

    private void ensureEnabled(User user) {
        if (!user.isEnabled()) {
            throw new ApplicationException(
                    ErrorCase.FORBIDDEN,
                    "Tu usuario está deshabilitado"
            );
        }
    }

    private ApplicationException unauthorized() {
        return new ApplicationException(
                ErrorCase.UNAUTHORIZED,
                "Credenciales incorrectas"
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(java.util.Locale.ROOT);
    }
}
