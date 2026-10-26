package com.fac.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "users",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_users_auth_provider_external_id",
                columnNames = {"auth_provider", "external_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
public class User {

    public static final String LOCAL_AUTH_PROVIDER = "LOCAL";

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @Column(
            nullable = false,
            length = 100
    )
    private String name;

    @Column(
            nullable = false,
            unique = true,
            length = 150
    )
    private String email;

    @Column(
            nullable = true,
            length = 255
    )
    private String password;

    @Column(
            name = "auth_provider",
            nullable = false,
            length = 50,
            columnDefinition = "VARCHAR(50) NOT NULL DEFAULT 'LOCAL'"
    )
    private String authProvider = LOCAL_AUTH_PROVIDER;

    @Column(
            name = "external_id",
            length = 255
    )
    private String externalId;

    @Column(
            nullable = false,
            columnDefinition = "TINYINT(1) NOT NULL DEFAULT 1"
    )
    private boolean enabled = true;

    @OneToOne(
            mappedBy = "user",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private Profile profile;

    @OneToMany(
            mappedBy = "user",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private List<Session> sessions = new ArrayList<>();

    @OneToMany(
            mappedBy = "user",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private List<UserRole> userRoles = new ArrayList<>();
}
