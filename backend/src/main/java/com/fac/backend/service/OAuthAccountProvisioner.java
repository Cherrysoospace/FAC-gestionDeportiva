package com.fac.backend.service;

import com.fac.backend.entity.Profile;
import com.fac.backend.entity.User;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.repository.UserRepository;
import com.fac.backend.security.AuthProviders;
import com.fac.backend.security.ExternalIdentity;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * HU-SE-08: encuentra o crea el usuario interno de una identidad externa.
 * <ul>
 *   <li>Mismo proveedor e id externo: es el mismo usuario (no se duplica).</li>
 *   <li>Correo ya registrado con otro método: se rechaza.</li>
 *   <li>Primera vez: se crea sin contraseña, con la foto del proveedor y el
 *       rol por defecto.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class OAuthAccountProvisioner {

    private final UserRepository userRepository;
    private final UserRoleService userRoleService;

    @Transactional
    public User resolve(ExternalIdentity identity) {
        Optional<User> existingUser = userRepository.findByAuthProviderAndExternalId(
                identity.provider(),
                identity.uid()
        );

        if (existingUser.isPresent()) {
            return existingUser.get();
        }

        userRepository.findByEmailIgnoreCase(identity.email()).ifPresent(user -> {
            throw new ApplicationException(
                    ErrorCase.ALREADY_EXISTS,
                    alreadyRegisteredMessage(user.getAuthProvider())
            );
        });

        User user = new User();
        user.setName(resolveName(identity.name(), identity.email()));
        user.setEmail(identity.email());
        user.setPassword(null);
        user.setAuthProvider(identity.provider());
        user.setExternalId(identity.uid());
        user.setEnabled(true);
        attachProviderPhoto(user, identity.picture());

        User savedUser = userRepository.save(user);
        userRoleService.assignDefaultRole(savedUser);

        return savedUser;
    }

    // El perfil se guarda en cascada con el usuario (User.profile, CascadeType.ALL)
    private void attachProviderPhoto(User user, String photoUrl) {
        if (photoUrl == null || photoUrl.isBlank()) {
            return;
        }
        Profile profile = new Profile();
        profile.setPhotoUrl(photoUrl);
        profile.setUser(user);
        user.setProfile(profile);
    }

    private String alreadyRegisteredMessage(String authProvider) {
        String method = AuthProviders.label(authProvider);

        if (method == null) {
            return "Ese correo ya está registrado con otro método de acceso";
        }

        return "Ese correo ya está registrado con " + method
                + ". Inicia sesión con " + method + ".";
    }

    private String resolveName(String name, String email) {
        if (name != null && !name.isBlank()) {
            return name;
        }

        int atIndex = email.indexOf('@');
        return atIndex > 0 ? email.substring(0, atIndex) : email;
    }
}
