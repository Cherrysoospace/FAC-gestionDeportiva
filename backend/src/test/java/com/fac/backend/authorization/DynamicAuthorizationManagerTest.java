package com.fac.backend.authorization;

import com.fac.backend.entity.Permission;
import com.fac.backend.security.EffectivePermissionsFilter;
import com.fac.backend.service.PermissionService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationResult;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DynamicAuthorizationManagerTest {

    @Mock
    private PermissionService permissionService;

    @InjectMocks
    private DynamicAuthorizationManager authorizationManager;

    @Test
    void grantsAccessWhenUserHasPermission() {
        MockHttpServletRequest request = request("GET", "/api/roles");
        when(permissionService.hasPermission(1L, "GET", "/api/roles"))
                .thenReturn(true);

        AuthorizationResult result = authorize(request, authenticated("1"));

        assertTrue(result.isGranted());
    }

    @Test
    void deniesAccessWhenUserLacksPermission() {
        MockHttpServletRequest request = request("PUT", "/api/roles/1/permissions");
        when(permissionService.hasPermission(
                1L,
                "PUT",
                "/api/roles/1/permissions"
        )).thenReturn(false);

        AuthorizationResult result = authorize(request, authenticated("1"));

        assertFalse(result.isGranted());
    }

    @Test
    void deniesUnauthenticatedUsers() {
        MockHttpServletRequest request = request("GET", "/api/roles");

        AuthorizationResult result = authorize(request, null);

        assertFalse(result.isGranted());
        verifyNoInteractions(permissionService);
    }

    @Test
    void deniesPrincipalThatIsNotAUserId() {
        MockHttpServletRequest request = request("GET", "/api/roles");

        AuthorizationResult result = authorize(
                request,
                authenticated("external-user")
        );

        assertFalse(result.isGranted());
        verifyNoInteractions(permissionService);
    }

    @Test
    void allowsMeEndpointForAnyAuthenticatedUser() {
        MockHttpServletRequest request = request("GET", "/api/auth/me");

        AuthorizationResult result = authorize(request, authenticated("1"));

        assertTrue(result.isGranted());
        verifyNoInteractions(permissionService);
    }

    @Test
    void allowsLogoutForAnyAuthenticatedUser() {
        MockHttpServletRequest request = request("POST", "/api/auth/logout");

        AuthorizationResult result = authorize(request, authenticated("1"));

        assertTrue(result.isGranted());
        verifyNoInteractions(permissionService);
    }

    @Test
    void usesEffectivePermissionsAttachedToTheRequest() {
        MockHttpServletRequest request = request("GET", "/api/roles");
        request.setAttribute(
                EffectivePermissionsFilter.PERMISSIONS_ATTRIBUTE,
                List.of(Permission.builder()
                        .id(1L)
                        .method("GET")
                        .url("/api/roles")
                        .build())
        );

        AuthorizationResult result = authorize(request, authenticated("1"));

        assertTrue(result.isGranted());
        verifyNoInteractions(permissionService);
    }

    private MockHttpServletRequest request(String method, String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRequestURI(uri);
        return request;
    }

    private Authentication authenticated(String principal) {
        return new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    private AuthorizationResult authorize(
            MockHttpServletRequest request,
            Authentication authentication) {

        RequestAuthorizationContext context =
                new RequestAuthorizationContext(request);

        return authorizationManager.authorize(
                () -> authentication,
                context
        );
    }
}
