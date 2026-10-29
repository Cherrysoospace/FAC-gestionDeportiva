package com.fac.backend.authorization;

import com.fac.backend.entity.Permission;
import com.fac.backend.security.EffectivePermissionsFilter;
import com.fac.backend.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.authorization.AuthorizationResult;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
public class DynamicAuthorizationManager
        implements AuthorizationManager<RequestAuthorizationContext> {

    private static final String OWN_PROFILE_PATH = "/api/profile/me";

    private final PermissionService permissionService;

    @Override
    public AuthorizationResult authorize(
            Supplier<? extends Authentication> authenticationSupplier,
            RequestAuthorizationContext context) {

        Authentication authentication = authenticationSupplier.get();

        if (authentication == null || !authentication.isAuthenticated()) {
            return new AuthorizationDecision(false);
        }

        Long userId;

        try {
            userId = Long.valueOf(authentication.getName());
        } catch (NumberFormatException exception) {
            return new AuthorizationDecision(false);
        }

        HttpServletRequest request = context.getRequest();
        String method = request.getMethod();
        String url = request.getRequestURI();

        if ("POST".equals(method) && "/api/auth/logout".equals(url)) {
            return new AuthorizationDecision(true);
        }

        // Perfil propio: el id sale del token, así que todo usuario autenticado
        // puede gestionar el suyo y nunca el de otro (HU-SE-02).
        if (isOwnProfileRequest(url)) {
            return new AuthorizationDecision(true);
        }

        if ("GET".equals(method) && "/api/auth/me".equals(url)) {
            return new AuthorizationDecision(true);
        }

        List<Permission> effectivePermissions =
                resolveEffectivePermissions(request);

        boolean permitted = effectivePermissions != null
                ? effectivePermissions.stream()
                        .anyMatch(permission -> PermissionMatcher.matches(
                                permission,
                                method,
                                url
                        ))
                : permissionService.hasPermission(userId, method, url);

        return new AuthorizationDecision(permitted);
    }

    private boolean isOwnProfileRequest(String url) {
        return OWN_PROFILE_PATH.equals(url)
                || url.startsWith(OWN_PROFILE_PATH + "/");
    }

    @SuppressWarnings("unchecked")
    private List<Permission> resolveEffectivePermissions(
            HttpServletRequest request) {

        Object attribute = request.getAttribute(
                EffectivePermissionsFilter.PERMISSIONS_ATTRIBUTE
        );

        if (attribute instanceof List<?> permissions) {
            return (List<Permission>) permissions;
        }

        return null;
    }
}
