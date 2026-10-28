package com.fac.backend.repository;

import com.fac.backend.entity.RolePermission;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {

    boolean existsByRoleIdAndPermissionId(Long roleId, Long permissionId);

    @EntityGraph(attributePaths = {"role", "permission"})
    List<RolePermission> findAllByRoleId(Long roleId);

    @EntityGraph(attributePaths = {"role", "permission"})
    List<RolePermission> findAllByPermissionId(Long permissionId);

    @Override
    @EntityGraph(attributePaths = {"role", "permission"})
    List<RolePermission> findAll();

    @EntityGraph(attributePaths = {"role", "permission"})
    Optional<RolePermission> findByRoleIdAndPermissionId(Long roleId, Long permissionId);

    boolean existsByPermissionId(Long permissionId);

    long countByRoleId(Long roleId);
}
