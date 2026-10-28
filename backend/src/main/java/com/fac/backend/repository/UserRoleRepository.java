package com.fac.backend.repository;

import com.fac.backend.entity.UserRole;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    boolean existsByUserIdAndRoleId(Long userId, Long roleId);

    @EntityGraph(attributePaths = {"user", "role"})
    List<UserRole> findAllByUserId(Long userId);

    @EntityGraph(attributePaths = {"user", "role"})
    List<UserRole> findAllByRoleId(Long roleId);

    @Override
    @EntityGraph(attributePaths = {"user", "role"})
    List<UserRole> findAll();

    @EntityGraph(attributePaths = {"user", "role"})
    Optional<UserRole> findByUserIdAndRoleId(Long userId, Long roleId);

    boolean existsByRoleId(Long roleId);

    long countByRoleId(Long roleId);

    @Query("""
            SELECT CASE WHEN COUNT(ur) > 0 THEN true ELSE false END
            FROM UserRole ur
            WHERE ur.role.id = :roleId
              AND ur.user.enabled = true
            """)
    boolean existsEnabledUserByRoleId(@Param("roleId") Long roleId);

    @Query("""
            SELECT ur.user.id
            FROM UserRole ur
            JOIN ur.role r
            JOIN r.rolePermissions rp
            JOIN rp.permission p
            WHERE ur.user.enabled = true
              AND r.active = true
              AND CONCAT(p.method, ' ', p.url) IN :keys
            GROUP BY ur.user.id
            HAVING COUNT(DISTINCT CONCAT(p.method, ' ', p.url)) = :totalKeys
            """)
    List<Long> findUserIdsWithAllPermissions(
            @Param("keys") Collection<String> keys,
            @Param("totalKeys") long totalKeys
    );

    @Query("""
            SELECT ur.user.id
            FROM UserRole ur
            JOIN ur.role r
            JOIN r.rolePermissions rp
            JOIN rp.permission p
            WHERE ur.user.enabled = true
              AND r.active = true
              AND r.id <> :excludedRoleId
              AND CONCAT(p.method, ' ', p.url) IN :keys
            GROUP BY ur.user.id
            HAVING COUNT(DISTINCT CONCAT(p.method, ' ', p.url)) = :totalKeys
            """)
    List<Long> findUserIdsWithAllPermissionsExcludingRole(
            @Param("excludedRoleId") Long excludedRoleId,
            @Param("keys") Collection<String> keys,
            @Param("totalKeys") long totalKeys
    );
}
