package com.fac.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Inicio de sesión pendiente del segundo factor (HU-SE-10).
 * El identificador del reto ata el código al proceso de login que lo pidió.
 * Del identificador y del código solo se guarda el hash.
 */
@Entity
@Table(
        name = "two_factor_challenges",
        indexes = @Index(
                name = "idx_two_factor_challenges_user_id",
                columnList = "user_id"
        )
)
@Getter
@Setter
@NoArgsConstructor
public class TwoFactorChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "challenge_hash", nullable = false, unique = true, length = 64)
    private String challengeHash;

    @Column(name = "code_hash", nullable = false, length = 64)
    private String codeHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "attempts", nullable = false)
    private int attempts = 0;

    @Column(name = "last_sent_at", nullable = false)
    private LocalDateTime lastSentAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public boolean isUsed() {
        return usedAt != null;
    }

    public boolean isCancelled() {
        return cancelledAt != null;
    }

    public boolean isExpired(LocalDateTime now) {
        return expiresAt.isBefore(now);
    }

    public boolean isUsable(LocalDateTime now, int maxAttempts) {
        return !isUsed()
                && !isCancelled()
                && !isExpired(now)
                && attempts < maxAttempts;
    }

    public void registerFailedAttempt() {
        attempts++;
    }
}
