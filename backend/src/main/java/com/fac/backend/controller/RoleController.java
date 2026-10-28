package com.fac.backend.controller;

import java.util.List;

import com.fac.backend.dto.permission.RolePermissionsAssignmentDTO;
import com.fac.backend.dto.permission.RoleSummaryResponseDTO;
import com.fac.backend.dto.permission.UpdateRolePermissionsRequestDTO;
import com.fac.backend.dto.role.RoleRequestDTO;
import com.fac.backend.dto.role.RoleResponseDTO;
import com.fac.backend.dto.RolePermissionsResponseDTO;
import com.fac.backend.service.RolePermissionService;
import com.fac.backend.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;
    private final RolePermissionService rolePermissionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoleResponseDTO create(@Valid @RequestBody RoleRequestDTO dto) {
        return roleService.create(dto);
    }

    @GetMapping
    public List<RoleResponseDTO> findAll() {
        return roleService.findAll();
    }

    @GetMapping("/{id}")
    public RoleResponseDTO findById(@PathVariable Long id) {
        return roleService.findById(id);
    }

    @GetMapping("/{id}/detail-with-permissions")
    public RolePermissionsResponseDTO findByIdAndPermissions(@PathVariable Long id) {
        return roleService.findByIdAndPermissions(id);
    }

    @GetMapping("/{id}/permissions")
    public RolePermissionsAssignmentDTO findPermissions(@PathVariable Long id) {
        return rolePermissionService.findRolePermissions(id);
    }

    @GetMapping("/{id}/summary")
    public RoleSummaryResponseDTO findSummary(@PathVariable Long id) {
        return rolePermissionService.findRoleSummary(id);
    }

    @PutMapping("/{id}/permissions")
    public RolePermissionsAssignmentDTO updatePermissions(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRolePermissionsRequestDTO dto,
            @AuthenticationPrincipal Jwt jwt) {

        Long actorUserId = jwt == null ? null : Long.valueOf(jwt.getSubject());
        String actorEmail = jwt == null
                ? null
                : jwt.getClaimAsString("email");

        return rolePermissionService.syncPermissions(
                id,
                dto,
                actorUserId,
                actorEmail
        );
    }

    @PutMapping("/{id}")
    public RoleResponseDTO update(
            @PathVariable Long id,
            @Valid @RequestBody RoleRequestDTO dto
    ) {
        return roleService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        roleService.delete(id);
    }
}