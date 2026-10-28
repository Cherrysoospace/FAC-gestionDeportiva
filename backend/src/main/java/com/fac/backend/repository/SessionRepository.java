package com.fac.backend.repository;

import com.fac.backend.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

public interface SessionRepository extends JpaRepository<Session, Long> {

    List<Session> findAllByUserId(Long userId);

    Optional<Session> findByIdAndUserId(Long sessionId, Long userId);

    @EntityGraph(attributePaths = "user")
    Optional<Session> findByJti(String jti);

    List<Session> findAllByUserIdAndInvalidatedAtIsNullAndExpiresAtAfter(
            Long userId,
            LocalDateTime now
    );

    boolean existsByToken(String token);

    boolean existsByTokenAndIdNot(String token, Long id);
}
