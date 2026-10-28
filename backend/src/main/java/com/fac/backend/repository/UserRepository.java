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
}