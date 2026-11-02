package com.fac.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fac.backend.dto.role.RoleRequestDTO;
import com.fac.backend.dto.role.RoleResponseDTO;
import com.fac.backend.entity.Role;
import com.fac.backend.exception.ApplicationException;
import com.fac.backend.exception.ErrorCase;
import com.fac.backend.mapper.RoleMapper;
import com.fac.backend.mapper.RolePermissionMapper;
import com.fac.backend.repository.RolePermissionRepository;
import com.fac.backend.repository.RoleRepository;
import com.fac.backend.repository.UserRoleRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private RolePermissionRepository rolePermissionRepository;

    @Mock
    private RolePermissionMapper rolePermissionMapper;

    private RoleService roleService;

    @BeforeEach
    void setUp() {
        RoleMapper roleMapper = new RoleMapper(rolePermissionMapper);
        roleService = new RoleService(
                roleRepository,
                userRoleRepository,
                rolePermissionRepository,
                roleMapper
        );
    }

    @Test
    @DisplayName("HU-SE-03: crea un rol con nombre y descripción cuando no existe duplicado")
    void createShouldSaveRoleWhenNameIsUnique() {
        RoleRequestDTO request = new RoleRequestDTO();
        request.setName("Auditor");
        request.setDescription("Rol encargado de auditoría interna");
        request.setActive(true);

        when(roleRepository.existsByNameIgnoreCase("Auditor")).thenReturn(false);
        when(roleRepository.save(any(Role.class))).thenAnswer(invocation -> {
            Role saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        RoleResponseDTO response = roleService.create(request);

        assertEquals(10L, response.getId());
        assertEquals("Auditor", response.getName());
        assertEquals("Rol encargado de auditoría interna", response.getDescription());
        assertTrue(response.isActive());
    }

    @Test
    @DisplayName("HU-SE-03: rechaza registrar un rol duplicado sin importar mayúsculas o minúsculas")
    void createShouldRejectDuplicateNameIgnoreCase() {
        RoleRequestDTO request = new RoleRequestDTO();
        request.setName("admin");
        request.setDescription("Intento de duplicado");

        when(roleRepository.existsByNameIgnoreCase("admin")).thenReturn(true);

        ApplicationException ex = assertThrows(
                ApplicationException.class,
                () -> roleService.create(request)
        );

        assertEquals(ErrorCase.ALREADY_EXISTS, ex.getErrorCase());
        assertEquals("Ya existe un rol con ese nombre", ex.getMessage());
        verify(roleRepository, never()).save(any(Role.class));
    }

    @Test
    @DisplayName("HU-SE-03: permite editar nombre, descripción y estado de un rol existente")
    void updateShouldModifyRoleFieldsWhenNameIsAvailable() {
        Role existing = new Role();
        existing.setId(5L);
        existing.setName("Secretaria");
        existing.setDescription("Descripción inicial");
        existing.setActive(true);

        RoleRequestDTO request = new RoleRequestDTO();
        request.setName("Secretaría General");
        request.setDescription("Descripción actualizada");
        request.setActive(false);

        when(roleRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(roleRepository.existsByNameIgnoreCaseAndIdNot("Secretaría General", 5L))
                .thenReturn(false);
        when(roleRepository.save(existing)).thenReturn(existing);

        RoleResponseDTO response = roleService.update(5L, request);

        assertEquals(5L, response.getId());
        assertEquals("Secretaría General", response.getName());
        assertEquals("Descripción actualizada", response.getDescription());
        assertEquals(false, response.isActive());
    }

    @Test
    @DisplayName("HU-SE-03: impide eliminar un rol que tiene usuarios asociados")
    void deleteShouldRejectWhenRoleHasAssignedUsers() {
        Role existing = new Role();
        existing.setId(3L);
        existing.setName("COORDINADOR");

        when(roleRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(userRoleRepository.existsByRoleId(3L)).thenReturn(true);

        ApplicationException ex = assertThrows(
                ApplicationException.class,
                () -> roleService.delete(3L)
        );

        assertEquals(ErrorCase.INVALID_OPERATION, ex.getErrorCase());
        assertEquals("No se puede eliminar un rol que está asignado", ex.getMessage());
        verify(roleRepository, never()).delete(any(Role.class));
    }
}
