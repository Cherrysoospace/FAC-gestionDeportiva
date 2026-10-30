package com.fac.backend.repository;

import com.fac.backend.entity.TwoFactorChallenge;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface TwoFactorChallengeRepository
        extends JpaRepository<TwoFactorChallenge, Long> {

    // Bloqueo de escritura: dos peticiones simultáneas con el mismo código
    // no pueden consumirlo ambas.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "user")
    Optional<TwoFactorChallenge> findByChallengeHash(String challengeHash);

    void deleteByUserIdAndUsedAtIsNull(Long userId);
}
