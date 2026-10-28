package com.fac.backend.entity;

import java.time.LocalDateTime;

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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "sessions",
        indexes = @Index(
                name = "idx_sessions_user_id",
                columnList = "user_id"
        )
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Session {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "token", length = 500)
    private String token;

    @Column(name = "expiration")
    private LocalDateTime expiration;

    @Column(name = "jti", unique = true, length = 36)
    private String jti;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "invalidated_at")
    private LocalDateTime invalidatedAt;

    @Column(
            name = "code_2fa",
            length = 10
    )
    private String code2FA;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "user_id",
            nullable = false
    )
    private User user;

    public boolean isExpired() {
        LocalDateTime sessionExpiration = expiresAt != null
                ? expiresAt
                : expiration;
        return sessionExpiration != null
                && sessionExpiration.isBefore(LocalDateTime.now());
    }

    public boolean isInvalidated() {
        return invalidatedAt != null;
    }
}