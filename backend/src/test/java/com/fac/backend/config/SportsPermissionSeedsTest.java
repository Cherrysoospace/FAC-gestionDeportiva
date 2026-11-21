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
        assertTrue(containsKey(SportsPermissionSeeds.ALL,
                "DELETE " + PermissionMatcher.normalizeUrl("/gestion-deportiva/teams/4/related-teams/9")));
        assertTrue(containsKey(SportsPermissionSeeds.ALL,
                "PATCH " + PermissionMatcher.normalizeUrl("/gestion-deportiva/team-players/3")));
        assertTrue(containsKey(SportsPermissionSeeds.ALL,
                "PATCH " + PermissionMatcher.normalizeUrl("/gestion-deportiva/player-skills/8")));
        assertTrue(containsKey(SportsPermissionSeeds.ALL,
                "PUT " + PermissionMatcher.normalizeUrl("/gestion-deportiva/matches/9/result")));
        assertTrue(containsKey(SportsPermissionSeeds.ALL,
                "PATCH " + PermissionMatcher.normalizeUrl("/gestion-deportiva/bets/14/void")));
        assertTrue(containsKey(SportsPermissionSeeds.ALL,
                "PATCH " + PermissionMatcher.normalizeUrl("/gestion-deportiva/me/bets/14/cancel")));
        assertTrue(containsKey(SportsPermissionSeeds.ALL,
                "DELETE " + PermissionMatcher.normalizeUrl("/gestion-deportiva/me/favorite-teams/6")));
    }

    @Test
    void fanOnlyReadsAndNeverWrites() {
        assertFalse(SportsPermissionSeeds.FAN_READ_ONLY.isEmpty());
        assertTrue(SportsPermissionSeeds.FAN_READ_ONLY.stream()
                .allMatch(seed -> "GET".equals(seed.method())));
        assertTrue(SportsPermissionSeeds.ALL.containsAll(SportsPermissionSeeds.FAN_READ_ONLY));
    }

    @Test
    void fanPermissionsIncludeSelfServiceAndPublicQueriesWithoutAdminWrites() {
        assertTrue(SportsPermissionSeeds.ALL.containsAll(SportsPermissionSeeds.FAN_PERMISSIONS));
        assertTrue(SportsPermissionSeeds.FAN_PERMISSIONS.containsAll(SportsPermissionSeeds.FAN_SELF_SERVICE));

        Set<String> keys = new HashSet<>();
        SportsPermissionSeeds.FAN_PERMISSIONS.forEach(seed ->
                assertTrue(keys.add(seed.key()), "Permiso repetido para aficionado: " + seed.key()));

        assertTrue(containsKey(SportsPermissionSeeds.FAN_PERMISSIONS, "GET /gestion-deportiva/goals"));
        assertTrue(containsKey(SportsPermissionSeeds.FAN_PERMISSIONS, "GET /gestion-deportiva/payment-methods"));
        assertTrue(containsKey(SportsPermissionSeeds.FAN_PERMISSIONS, "GET /gestion-deportiva/tickets/availability"));
        assertTrue(containsKey(SportsPermissionSeeds.FAN_PERMISSIONS, "GET /gestion-deportiva/bets/available-matches"));
        assertTrue(containsKey(SportsPermissionSeeds.FAN_PERMISSIONS, "POST /gestion-deportiva/me/fan"));
        assertTrue(containsKey(SportsPermissionSeeds.FAN_PERMISSIONS, "POST /gestion-deportiva/me/favorite-teams"));
        assertTrue(containsKey(SportsPermissionSeeds.FAN_PERMISSIONS, "POST /gestion-deportiva/me/payment-methods"));
        assertTrue(containsKey(SportsPermissionSeeds.FAN_PERMISSIONS, "POST /gestion-deportiva/me/tickets"));
        assertTrue(containsKey(SportsPermissionSeeds.FAN_PERMISSIONS, "PATCH /gestion-deportiva/me/bets/{id}/cancel"));

        assertFalse(containsKey(SportsPermissionSeeds.FAN_PERMISSIONS, "GET /gestion-deportiva/fans"));
        assertFalse(containsKey(SportsPermissionSeeds.FAN_PERMISSIONS, "GET /gestion-deportiva/tickets"));
        assertFalse(containsKey(SportsPermissionSeeds.FAN_PERMISSIONS, "GET /gestion-deportiva/bets"));
        assertTrue(SportsPermissionSeeds.FAN_PERMISSIONS.stream()
                .filter(seed -> !"GET".equals(seed.method()))
                .allMatch(seed -> seed.url().startsWith("/gestion-deportiva/me/")));
    }

    @Test
    void fanCanBrowseTournamentsButNotAdministrativeAssociations() {
        assertTrue(containsKey(SportsPermissionSeeds.FAN_READ_ONLY, "GET /gestion-deportiva/tournaments"));
        assertTrue(containsKey(SportsPermissionSeeds.FAN_READ_ONLY, "GET /gestion-deportiva/players/{id}/profile"));
        assertFalse(containsKey(SportsPermissionSeeds.FAN_READ_ONLY, "POST /gestion-deportiva/tournaments"));
        assertFalse(containsKey(SportsPermissionSeeds.FAN_READ_ONLY, "GET /gestion-deportiva/registrations"));
    }

    @Test
    void simulatorOnlyReadsMatchAndRecordsPositions() {
        assertTrue(SportsPermissionSeeds.ALL.containsAll(SportsPermissionSeeds.POSITION_SIMULATOR));
        assertTrue(containsKey(SportsPermissionSeeds.POSITION_SIMULATOR, "POST /gestion-deportiva/match-positions"));
        assertFalse(SportsPermissionSeeds.POSITION_SIMULATOR.stream()
                .anyMatch(seed -> seed.url().equals("/gestion-deportiva/matches") && !"GET".equals(seed.method())));
        assertTrue(containsKey(SportsPermissionSeeds.FAN_READ_ONLY, "GET /gestion-deportiva/match-positions"));
        assertFalse(containsKey(SportsPermissionSeeds.FAN_READ_ONLY, "POST /gestion-deportiva/match-positions"));
    }

    private static boolean containsKey(List<PermissionSeed> seeds, String key) {
        return seeds.stream().anyMatch(seed -> seed.key().equals(key));
    }
}
