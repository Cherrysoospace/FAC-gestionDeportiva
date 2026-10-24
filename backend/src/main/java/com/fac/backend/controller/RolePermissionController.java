package com.fac.backend.controller;

import com.fac.backend.dto.AssignPermissionRequestDTO;
import com.fac.backend.dto.PermissionRoleResponseDTO;
import com.fac.backend.dto.RolePermissionResponseDTO;
import com.fac.backend.service.RolePermissionService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/role-permissions")
@RequiredArgsConstructor
public class RolePermissionController {

    private final RolePermissionService rolePermissionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RolePermissionResponseDTO assign(
            @Valid @RequestBody AssignPermissionRequestDTO dto) {
        return rolePermissionService.assign(dto);
    }

    @GetMapping
    public List<RolePermissionResponseDTO> findAll() {
        return rolePermissionService.findAll();
    }

    @GetMapping("/roles/{roleId}")
    public List<RolePermissionResponseDTO> findByRoleId(@PathVariable Long roleId) {
        return rolePermissionService.findByRoleId(roleId);
    }

    @GetMapping("/permissions/{permissionId}")
    public List<PermissionRoleResponseDTO> findByPermissionId(
            @PathVariable Long permissionId) {
        return rolePermissionService.findByPermissionId(permissionId);
    }

    @DeleteMapping("/{roleId}/{permissionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long roleId, @PathVariable Long permissionId) {
        rolePermissionService.delete(roleId, permissionId);
    }
}
