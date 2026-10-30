package com.fac.backend.repository;

import java.util.Optional;

import com.fac.backend.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByAuthProviderAndExternalId(
            String authProvider,
            String externalId
    );

    @EntityGraph(attributePaths = {"profile"}) // Indica que se debe cargar el perfil junto con el usuario
    Optional<User> findWithProfileById(Long id); //basicamente, el JOIN 

    @EntityGraph(attributePaths = {"sessions"})
    Optional<User> findWithSessionsById(Long id);

    @EntityGraph(attributePaths = {"userRoles", "userRoles.role"})
    Optional<User> findWithRolesById(Long id);

    @org.springframework.data.jpa.repository.Query("""
            SELECT u
            FROM User u
            WHERE NOT EXISTS (
                SELECT 1
                FROM UserRole ur
                WHERE ur.user = u
                  AND ur.role.id = :roleId
            )
            ORDER BY u.name ASC
            """)
    java.util.List<User> findAvailableByRoleId(
            @org.springframework.data.repository.query.Param("roleId") Long roleId
    );
}