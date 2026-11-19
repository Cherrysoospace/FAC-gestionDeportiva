package com.fac.backend.config;

import com.fac.backend.authorization.PermissionMatcher;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SportsPermissionSeedsTest {

    @Test
    void everySeedBelongsToSportsModuleWithPrefixAndResource() {
        assertTrue(SportsPermissionSeeds.ALL.stream().allMatch(seed ->
                seed.url().startsWith("/gestion-deportiva/")
                        && SportsPermissionSeeds.MODULE.equals(seed.module())
                        && seed.resource() != null && !seed.resource().isBlank()));
    }

    @Test
    void seedsHaveNoDuplicatedMethodAndUrl() {
        Set<String> keys = new HashSet<>();
        SportsPermissionSeeds.ALL.forEach(seed ->
                assertTrue(keys.add(seed.key()), "Permiso repetido: " + seed.key()));
    }

    // El guard envía la URL real (/tournaments/5); ms_security la normaliza a {id}.
    // Si la semilla no estuviera ya normalizada, nunca coincidiría.
    @Test
    void seedUrlsAreAlreadyNormalized() {
        SportsPermissionSeeds.ALL.forEach(seed ->
                assertEquals(seed.url(), PermissionMatcher.normalizeUrl(seed.url())));
    }

    @Test
    void nestedRoutesMatchTheirSeeds() {
        assertTrue(containsKey(SportsPermissionSeeds.ALL,
                "DELETE " + PermissionMatcher.normalizeUrl("/gestion-deportiva/group-phases/5/teams/3")));
        assertTrue(containsKey(SportsPermissionSeeds.ALL,
                "PATCH " + PermissionMatcher.normalizeUrl("/gestion-deportiva/registrations/7/withdraw")));
        assertTrue(containsKey(SportsPermissionSeeds.ALL,
                "GET " + PermissionMatcher.normalizeUrl("/gestion-deportiva/players/12/profile")));
    }

    @Test
    void fanOnlyReadsAndNeverWrites() {
        assertFalse(SportsPermissionSeeds.FAN_READ_ONLY.isEmpty());
        assertTrue(SportsPermissionSeeds.FAN_READ_ONLY.stream()
                .allMatch(seed -> "GET".equals(seed.method())));
        assertTrue(SportsPermissionSeeds.ALL.containsAll(SportsPermissionSeeds.FAN_READ_ONLY));
    }

    @Test
    void fanCanBrowseTournamentsButNotAdministrativeAssociations() {
        assertTrue(containsKey(SportsPermissionSeeds.FAN_READ_ONLY, "GET /gestion-deportiva/tournaments"));
        assertTrue(containsKey(SportsPermissionSeeds.FAN_READ_ONLY, "GET /gestion-deportiva/players/{id}/profile"));
        assertFalse(containsKey(SportsPermissionSeeds.FAN_READ_ONLY, "POST /gestion-deportiva/tournaments"));
        assertFalse(containsKey(SportsPermissionSeeds.FAN_READ_ONLY, "GET /gestion-deportiva/registrations"));
    }

    private static boolean containsKey(List<PermissionSeed> seeds, String key) {
        return seeds.stream().anyMatch(seed -> seed.key().equals(key));
    }
}
