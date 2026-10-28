package com.fac.backend.service;

import com.fac.backend.authorization.PermissionOperation;
import com.fac.backend.dto.permission.PermissionItemDTO;
import com.fac.backend.dto.permission.RolePermissionsAssignmentDTO;
import com.fac.backend.dto.permission.RoleSummaryResponseDTO;
import com.fac.backend.dto.permission.UpdateRolePermissionsRequestDTO;
import com.fac.backend.entity.Permission;
import com.fac.backend.entity.Role;
import com.fac.backend.entity.RolePermission;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.RolePermissionMapper;
import com.fac.backend.repository.PermissionRepository;
import com.fac.backend.repository.RolePermissionRepository;
import com.fac.backend.repository.RoleRepository;
import com.fac.backend.repository.UserRoleRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RolePermissionServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private RolePermissionRepository rolePermissionRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private RolePermissionMapper rolePermissionMapper;

    @Mock
    private PermissionCatalogService permissionCatalogService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private RolePermissionService rolePermissionService;

    @Test
    @SuppressWarnings("unchecked")
    void syncAddsAndRemovesPermissionsInOneOperation() {
        Role role = role(1L, "ADMIN");
        Permission current = permission(1L, "GET", "/api/users");
        Permission requested = permission(2L, "POST", "/api/users");

        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(permissionRepository.findAllById(List.of(2L)))
                .thenReturn(List.of(requested));
        when(permissionRepository.findAll())
                .thenReturn(List.of(current, requested));
        when(rolePermissionRepository.findAllByRoleId(1L))
                .thenReturn(List.of(assignment(role, current)));
        when(permissionCatalogService.toItems(anyList()))
                .thenReturn(List.of(item(requested)));
        when(permissionRepository.count()).thenReturn(2L);

        RolePermissionsAssignmentDTO result = rolePermissionService
                .syncPermissions(1L, request(List.of(2L)), 10L, "admin@test.com");

        assertEquals(List.of(2L), result.getPermissionIds());
        assertEquals(2L, result.getTotalAvailable());

        ArgumentCaptor<List<RolePermission>> removed =
                ArgumentCaptor.forClass(List.class);
        verify(rolePermissionRepository).deleteAll(removed.capture());
        assertEquals(1L, removed.getValue().get(0).getPermission().getId());

        ArgumentCaptor<List<RolePermission>> added =
                ArgumentCaptor.forClass(List.class);
        verify(rolePermissionRepository).saveAll(added.capture());
        assertEquals(2L, added.getValue().get(0).getPermission().getId());

        verify(auditService).logPermissionChange(
                eq(10L),
                eq("admin@test.com"),
                eq(role),
                eq(Set.of(2L)),
                eq(Set.of(1L)),
                eq(Set.of(2L))
        );
    }

    @Test
    void syncRejectsDuplicatedPermissionIds() {
        Role role = role(1L, "ADMIN");
        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> rolePermissionService.syncPermissions(
                        1L,
                        request(List.of(1L, 1L)),
                        10L,
                        "admin@test.com"
                )
        );

        assertEquals(ErrorCase.INVALID_OPERATION, exception.getErrorCase());
        verifyNoInteractions(permissionRepository);
        verifyNoInteractions(rolePermissionRepository);
        verifyNoInteractions(auditService);
    }

    @Test
    void syncRejectsUnknownPermissionIds() {
        Role role = role(1L, "ADMIN");
        Permission existing = permission(1L, "GET", "/api/users");

        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(permissionRepository.findAllById(List.of(1L, 99L)))
                .thenReturn(List.of(existing));

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> rolePermissionService.syncPermissions(
                        1L,
                        request(List.of(1L, 99L)),
                        10L,
                        "admin@test.com"
                )
        );

        assertEquals(ErrorCase.INVALID_OPERATION, exception.getErrorCase());
        verify(rolePermissionRepository, never()).deleteAll(anyList());
        verifyNoInteractions(auditService);
    }

    @Test
    void syncRejectsChangesThatLeaveSystemWithoutRoleManagementAccess() {
        Role role = role(1L, "ADMIN");
        Permission management = permission(10L, "GET", "/api/roles");

        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(permissionRepository.findAllById(List.of()))
                .thenReturn(List.of());
        when(permissionRepository.findAll())
                .thenReturn(List.of(management));
        when(rolePermissionRepository.findAllByRoleId(1L))
                .thenReturn(List.of(assignment(role, management)));
        when(userRoleRepository.findUserIdsWithAllPermissions(
                anyCollection(),
                eq(1L)
        )).thenReturn(List.of(100L));
        when(userRoleRepository.findUserIdsWithAllPermissionsExcludingRole(
                eq(1L),
                anyCollection(),
                eq(1L)
        )).thenReturn(List.of());

        ApplicationException exception = assertThrows(
                ApplicationException.class,
                () -> rolePermissionService.syncPermissions(
                        1L,
                        request(List.of()),
                        10L,
                        "admin@test.com"
                )
        );

        assertEquals(ErrorCase.INVALID_OPERATION, exception.getErrorCase());
        verify(rolePermissionRepository, never()).deleteAll(anyList());
        verifyNoInteractions(auditService);
    }

    @Test
    void syncAllowsChangesWhenAnotherUserKeepsRoleManagementAccess() {
        Role role = role(1L, "ADMIN");
        Permission management = permission(10L, "GET", "/api/roles");

        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(permissionRepository.findAllById(List.of()))
                .thenReturn(List.of());
        when(permissionRepository.findAll())
                .thenReturn(List.of(management));
        when(rolePermissionRepository.findAllByRoleId(1L))
                .thenReturn(List.of(assignment(role, management)));
        when(userRoleRepository.findUserIdsWithAllPermissions(
                anyCollection(),
                eq(1L)
        )).thenReturn(List.of(100L));
        when(userRoleRepository.findUserIdsWithAllPermissionsExcludingRole(
                eq(1L),
                anyCollection(),
                eq(1L)
        )).thenReturn(List.of(200L));
        when(permissionCatalogService.toItems(anyList()))
                .thenReturn(List.of());
        when(permissionRepository.count()).thenReturn(1L);

        RolePermissionsAssignmentDTO result = rolePermissionService
                .syncPermissions(1L, request(List.of()), 10L, "admin@test.com");

        assertEquals(0, result.getTotalAssigned());
        verify(rolePermissionRepository).deleteAll(anyList());
        verify(auditService).logPermissionChange(
                eq(10L),
                eq("admin@test.com"),
                eq(role),
                eq(Set.of()),
                eq(Set.of(10L)),
                eq(Set.of())
        );
    }

    @Test
    void syncKeepsManagementAccessWhenRoleRetainsAllPermissions() {
        Role role = role(1L, "ADMIN");
        Permission management = permission(10L, "GET", "/api/roles");

        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(permissionRepository.findAllById(List.of(10L)))
                .thenReturn(List.of(management));
        when(permissionRepository.findAll())
                .thenReturn(List.of(management));
        when(rolePermissionRepository.findAllByRoleId(1L))
                .thenReturn(List.of(assignment(role, management)));
        when(userRoleRepository.findUserIdsWithAllPermissions(
                anyCollection(),
                eq(1L)
        )).thenReturn(List.of(100L));
        when(userRoleRepository.existsEnabledUserByRoleId(1L))
                .thenReturn(true);
        when(permissionCatalogService.toItems(anyList()))
                .thenReturn(List.of(item(management)));
        when(permissionRepository.count()).thenReturn(1L);

        RolePermissionsAssignmentDTO result = rolePermissionService
                .syncPermissions(1L, request(List.of(10L)), 10L, "admin@test.com");

        assertEquals(List.of(10L), result.getPermissionIds());
        verify(rolePermissionRepository, never()).deleteAll(anyList());
        verify(rolePermissionRepository, never()).saveAll(anyList());
        verifyNoInteractions(auditService);
    }

    @Test
    void summaryCountsUsersPermissionsAndModules() {
        Role role = role(1L, "ADMIN");
        Permission listUsers = permission(1L, "GET", "/api/users");
        Permission createUsers = permission(2L, "POST", "/api/users");
        role.setRolePermissions(List.of(
                assignment(role, listUsers),
                assignment(role, createUsers)
        ));

        when(roleRepository.findWithPermissionsById(1L))
                .thenReturn(Optional.of(role));
        when(permissionCatalogService.toItems(anyList())).thenReturn(List.of(
                item(listUsers),
                item(createUsers)
        ));
        when(permissionRepository.count()).thenReturn(5L);
        when(userRoleRepository.countByRoleId(1L)).thenReturn(3L);

        RoleSummaryResponseDTO summary = rolePermissionService
                .findRoleSummary(1L);

        assertEquals(3L, summary.getUsersCount());
        assertEquals(2, summary.getAssignedCount());
        assertEquals(5, summary.getTotalAvailable());
        assertEquals(3, summary.getNotAssigned());
        assertEquals(List.of("Administración"), summary.getModulesWithAccess());
    }

    private Role role(Long id, String name) {
        Role role = new Role();
        role.setId(id);
        role.setName(name);
        role.setDescription("Rol de prueba");
        role.setActive(true);
        return role;
    }

    private Permission permission(Long id, String method, String url) {
        return Permission.builder()
                .id(id)
                .method(method)
                .url(url)
                .build();
    }

    private RolePermission assignment(Role role, Permission permission) {
        RolePermission assignment = new RolePermission();
        assignment.setRole(role);
        assignment.setPermission(permission);
        return assignment;
    }

    private PermissionItemDTO item(Permission permission) {
        return new PermissionItemDTO(
                permission.getId(),
                permission.getUrl(),
                permission.getMethod(),
                "Administración",
                "Usuarios",
                PermissionOperation.CREAR,
                "Crear"
        );
    }

    private UpdateRolePermissionsRequestDTO request(Collection<Long> ids) {
        UpdateRolePermissionsRequestDTO dto =
                new UpdateRolePermissionsRequestDTO();
        dto.setPermissionIds(List.copyOf(ids));
        return dto;
    }
}
