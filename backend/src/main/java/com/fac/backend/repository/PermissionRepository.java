package com.fac.backend.repository;

import com.fac.backend.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    boolean existsByUrlAndMethod(String url, String method);

    boolean existsByUrlAndMethodAndIdNot(String url, String method, Long id);

    Optional<Permission> findByUrlAndMethod(String url, String method);

    @Query("""
            SELECT DISTINCT p
            FROM Permission p
            JOIN p.rolePermissions rp
            JOIN rp.role r
            JOIN r.userRoles ur
            WHERE ur.user.id = :userId
              AND ur.user.enabled = true
              AND r.active = true
              AND UPPER(p.method) = UPPER(:method)
              AND p.url = :url
            """)
    List<Permission> findByUserIdAndMethodAndUrl(
            @Param("userId") Long userId,
            @Param("method") String method,
            @Param("url") String url
    );

    @Query("""
            SELECT DISTINCT p
            FROM Permission p
            JOIN p.rolePermissions rp
            JOIN rp.role r
            JOIN r.userRoles ur
            WHERE ur.user.id = :userId
              AND ur.user.enabled = true
              AND r.active = true
            """)
    List<Permission> findAllByUserId(@Param("userId") Long userId);
}