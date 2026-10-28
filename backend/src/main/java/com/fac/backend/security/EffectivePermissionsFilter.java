package com.fac.backend.security;

import com.fac.backend.service.EffectivePermissionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class EffectivePermissionsFilter extends OncePerRequestFilter {

    public static final String USER_ID_ATTRIBUTE =
            EffectivePermissionsFilter.class.getName() + ".userId";

    public static final String PERMISSIONS_ATTRIBUTE =
            EffectivePermissionsFilter.class.getName() + ".permissions";

    private final EffectivePermissionService effectivePermissionService;

    public EffectivePermissionsFilter(
            EffectivePermissionService effectivePermissionService) {
        this.effectivePermissionService = effectivePermissionService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {
            try {
                Long userId = Long.valueOf(authentication.getName());
                request.setAttribute(USER_ID_ATTRIBUTE, userId);
                request.setAttribute(
                        PERMISSIONS_ATTRIBUTE,
                        effectivePermissionService.findByUserId(userId)
                );
            } catch (NumberFormatException ignored) {
                // El principal no representa un usuario local.
            }
        }

        filterChain.doFilter(request, response);
    }
}
