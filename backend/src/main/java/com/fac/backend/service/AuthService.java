package com.fac.backend.service;

import com.fac.backend.dto.AuthResponseDTO;
import com.fac.backend.dto.LoginRequestDTO;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.security.FirebaseIdentity;
import com.fac.backend.security.FirebaseTokenVerifier;
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

    @Transactional
    public AuthResponseDTO login(LoginRequestDTO dto) {
        User user = userRepository.findByEmail(dto.getEmail())
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

    public AuthResponseDTO issueSession(User user) {
        JwtService.IssuedToken issued = jwtService.generateToken(user);

        sessionService.registerAuthenticatedSession(
                user,
                issued.jti(),
                issued.expiresAt()
        );

        return issued.response();
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
}
