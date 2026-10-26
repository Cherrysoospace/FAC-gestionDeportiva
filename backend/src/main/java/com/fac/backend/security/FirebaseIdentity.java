package com.fac.backend.security;

public record FirebaseIdentity(
        String provider,
        String uid,
        String email,
        String name,
        String picture) {
}
