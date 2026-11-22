package com.fac.backend.config;

import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

/**
 * Catálogo de permisos del microservicio ms-sports (prefijo /gestion-deportiva).
 *
 * Cada ruta + método que expone ms-sports debe estar aquí: su SecurityGuard
 * consulta a ms_security con la URL real y PermissionMatcher la normaliza a
 * {id}, así que las URL se escriben ya normalizadas. El módulo y el recurso
 * van explícitos porque PermissionClassifier solo deduce los de /api/.
 *
 * Para agregar un recurso nuevo basta con sumar una línea en RESOURCES.
 */
final class SportsPermissionSeeds {

    static final String MODULE = "Gestión Deportiva";

    private static final String PREFIX = "/gestion-deportiva";
    private static final String ID = "/{id}";

    /** Recursos que un aficionado puede consultar (solo GET). */
    private static final Set<String> FAN_READABLE_RESOURCES = Set.of(
            "Deportes",
            "Torneos",
            "Fases de grupos",
            "Fases finales",
            "Equipos",
            "Jugadores",
            "Escenarios",
            "Localidades",
            // HU-GC-09: la pizarra es para el administrador deportivo y el hincha
            "Partidos",
            "Anotaciones",
            "Posiciones",
            // HU-GC-10: el hincha consulta el catálogo de métodos de pago al armar su billetera
            "Métodos de pago"
    );

    /** Rutas de disponibilidad pública que el aficionado consulta sin listar todos los registros. */
    private static final Set<String> FAN_EXTRA_READABLE_PATHS = Set.of(
            PREFIX + "/tickets/availability",
            PREFIX + "/bets/available-matches"
    );

    /** Rutas de autogestión del aficionado autenticado (/me/...). */
    static final List<PermissionSeed> FAN_SELF_SERVICE = Stream.of(
            List.of(
                    get("/me/fan", "Mi perfil de aficionado"),
                    post("/me/fan", "Mi perfil de aficionado"),
                    patch("/me/fan", "Mi perfil de aficionado")
            ),
            List.of(
                    get("/me/favorite-teams", "Equipos favoritos"),
                    post("/me/favorite-teams", "Equipos favoritos"),
                    delete("/me/favorite-teams" + ID, "Equipos favoritos")
            ),
            crud("/me/payment-methods", "Mis métodos de pago"),
            association("/me/tickets", "Mis boletos"),
            List.of(
                    get("/me/bets", "Mis apuestas"),
                    get("/me/bets" + ID, "Mis apuestas"),
                    post("/me/bets", "Mis apuestas"),
                    patch("/me/bets" + ID, "Mis apuestas"),
                    patch("/me/bets" + ID + "/cancel", "Mis apuestas")
            )
    ).flatMap(List::stream).toList();

    private static final List<List<PermissionSeed>> RESOURCES = List.of(
            // HU-GD-01 y catálogo de pelotas
            crud("/sports", "Deportes"),
            crud("/balls", "Pelotas"),
            // HU-GC-01, 03, 04, 05 y 08 (inscripciones)
            crud("/tournaments", "Torneos"),
            // HU-GC-08 (desarrollo del torneo): recurso propio para que el aficionado
            // NO lo reciba con los GET de "Torneos"; es solo del administrador deportivo
            List.of(get("/tournaments" + ID + "/development", "Desarrollo de torneos")),
            concat(
                    crud("/group-phases", "Fases de grupos"),
                    List.of(
                            get("/group-phases" + ID + "/teams", "Fases de grupos"),
                            post("/group-phases" + ID + "/teams", "Fases de grupos"),
                            delete("/group-phases" + ID + "/teams" + ID, "Fases de grupos")
                    )
            ),
            crud("/final-phases", "Fases finales"),
            List.of(
                    get("/registrations", "Inscripciones"),
                    get("/registrations" + ID, "Inscripciones"),
                    post("/registrations", "Inscripciones"),
                    patch("/registrations" + ID + "/withdraw", "Inscripciones")
            ),
            association("/tournament-venues", "Escenarios de torneos"),
            // HU-GD-02 y 03 (más la autorrelación Equipo n — n Equipo del diagrama)
            concat(
                    crud("/teams", "Equipos"),
                    List.of(
                            get("/teams" + ID + "/related-teams", "Equipos"),
                            post("/teams" + ID + "/related-teams", "Equipos"),
                            delete("/teams" + ID + "/related-teams" + ID, "Equipos")
                    )
            ),
            association("/team-sports", "Deportes de equipos"),
            // HU-GD-04 y 08 (perfil del jugador)
            concat(
                    crud("/players", "Jugadores"),
                    List.of(get("/players" + ID + "/profile", "Jugadores"))
            ),
            // HU-GD-05: el retiro cierra la asociación, no la borra (historial de traspasos)
            List.of(
                    get("/team-players", "Plantillas"),
                    get("/team-players" + ID, "Plantillas"),
                    post("/team-players", "Plantillas"),
                    patch("/team-players" + ID, "Plantillas"),
                    patch("/team-players" + ID + "/release", "Plantillas")
            ),
            // HU-GD-06 y 07 (el PATCH de la asociación cambia el nivel)
            crud("/skills", "Habilidades"),
            concat(
                    association("/player-skills", "Habilidades de jugadores"),
                    List.of(patch("/player-skills" + ID, "Habilidades de jugadores"))
            ),
            // Escenarios jerárquicos y sus localidades
            crud("/venues", "Escenarios"),
            crud("/locations", "Localidades"),
            // HU-GC-06 y HU-GC-07 (el PATCH inicia/cancela; PUT /result registra el marcador final)
            concat(
                    crud("/matches", "Partidos"),
                    List.of(put("/matches" + ID + "/result", "Partidos"))
            ),
            // HU-GC-07: anotaciones del partido
            crud("/goals", "Anotaciones"),
            // HU-GC-09: GET = pizarra; POST = una "foto" del campo (simulador)
            List.of(
                    get("/match-positions", "Posiciones"),
                    post("/match-positions", "Posiciones")
            ),
            // Aficionados, métodos de pago, boletos y apuestas (Fercho)
            crud("/fans", "Aficionados"),
            crud("/payment-methods", "Métodos de pago"),
            List.of(
                    get("/tickets/availability", "Boletos"),
                    get("/tickets", "Boletos"),
                    get("/tickets" + ID, "Boletos"),
                    post("/tickets", "Boletos"),
                    delete("/tickets" + ID, "Boletos")
            ),
            List.of(
                    get("/bets/available-matches", "Apuestas"),
                    get("/bets", "Apuestas"),
                    get("/bets" + ID, "Apuestas"),
                    post("/bets", "Apuestas"),
                    patch("/bets" + ID + "/void", "Apuestas")
            )
            // FAN_SELF_SERVICE va aparte: /me/... es solo del aficionado
    );

    /**
     * Usuario de servicio del script simulador de posiciones: solo lee el
     * partido y su plantilla y registra posiciones. Nada más.
     */
    static final List<PermissionSeed> POSITION_SIMULATOR = List.of(
            get("/matches" + ID, "Partidos"),
            get("/team-players", "Plantillas"),
            get("/match-positions", "Posiciones"),
            post("/match-positions", "Posiciones")
    );

    /**
     * Permisos de administración de ms-sports: los recibe el Administrador deportivo.
     * No incluye /me/...: el admin deportivo no es aficionado y debe recibir 403 ahí.
     */
    static final List<PermissionSeed> ALL = RESOURCES.stream()
            .flatMap(List::stream)
            .toList();

    /** Catálogo completo de rutas de ms-sports (administración + autogestión /me/...). */
    static final List<PermissionSeed> CATALOG = concat(ALL, FAN_SELF_SERVICE);

    /** Consultas permitidas al aficionado: nunca escribe en rutas de administración. */
    static final List<PermissionSeed> FAN_READ_ONLY = ALL.stream()
            .filter(seed -> "GET".equals(seed.method()))
            .filter(seed -> FAN_READABLE_RESOURCES.contains(seed.resource())
                    || FAN_EXTRA_READABLE_PATHS.contains(seed.url()))
            .toList();

    /** Permisos completos del rol AFICIONADO: lectura deportiva + autogestión /me/... */
    static final List<PermissionSeed> FAN_PERMISSIONS = concat(FAN_READ_ONLY, FAN_SELF_SERVICE);

    private SportsPermissionSeeds() {
    }

    /** Listar, ver, crear, actualizar (PATCH) y eliminar. */
    private static List<PermissionSeed> crud(String path, String resource) {
        return List.of(
                get(path, resource),
                get(path + ID, resource),
                post(path, resource),
                patch(path + ID, resource),
                delete(path + ID, resource)
        );
    }

    /** Tabla intermedia: una asociación se crea o se retira, no se edita. */
    private static List<PermissionSeed> association(String path, String resource) {
        return List.of(
                get(path, resource),
                get(path + ID, resource),
                post(path, resource),
                delete(path + ID, resource)
        );
    }

    private static List<PermissionSeed> concat(
            List<PermissionSeed> first,
            List<PermissionSeed> second) {
        return Stream.concat(first.stream(), second.stream()).toList();
    }

    private static PermissionSeed get(String path, String resource) {
        return seed("GET", path, resource);
    }

    private static PermissionSeed post(String path, String resource) {
        return seed("POST", path, resource);
    }

    private static PermissionSeed put(String path, String resource) {
        return seed("PUT", path, resource);
    }

    private static PermissionSeed patch(String path, String resource) {
        return seed("PATCH", path, resource);
    }

    private static PermissionSeed delete(String path, String resource) {
        return seed("DELETE", path, resource);
    }

    private static PermissionSeed seed(String method, String path, String resource) {
        return new PermissionSeed(method, PREFIX + path, MODULE, resource);
    }
}
