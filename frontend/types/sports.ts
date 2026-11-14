/**
 * Tipos del microservicio ms-sports, copiados de sus DTO reales
 * (src/**\/dto/*.dto.ts y src/**\/enums/*.ts). Mismos nombres y nulabilidad.
 *
 * Fechas:
 * - "Fecha de día": string 'YYYY-MM-DD' (columnas date). Usar parseIsoDate/toIsoDate de lib/dates.ts.
 * - "Fecha y hora": string ISO 8601 (columnas datetime; el backend responde Date serializado).
 *   Para enviarlas, usar date.toISOString().
 */

// ---- Enums (uniones de strings) ----

export type TournamentStatus = 'PLANNED' | 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';

export type FinalRound = 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'THIRD_PLACE' | 'FINAL';

export type RegistrationStatus = 'ACTIVE' | 'WITHDRAWN';

export type TeamModality = 'MALE' | 'FEMALE' | 'MIXED';

export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';

// ---- Respuestas comunes ----

// Respuesta de los DELETE y de otras acciones sin cuerpo propio
export interface MessageResponse {
    message: string;
}

// ---- Deporte (sports/dto/sport-response.dto.ts) ----

export interface SportSummary {
    id: number;
    name: string;
    active: boolean;
}

export interface Sport {
    id: number;
    name: string;
    description: string | null;
    active: boolean;
    parent: SportSummary | null;
    // Solo en GET /sports/:id (relación cargada)
    subSports?: SportSummary[];
}

export interface CreateSportPayload {
    name: string;
    description?: string | null;
    // Ausente o null = deporte raíz
    parentId?: number | null;
}

export interface UpdateSportPayload {
    name?: string;
    description?: string | null;
    // undefined = no cambia; null = pasa a ser raíz
    parentId?: number | null;
    active?: boolean;
}

export interface SportQuery {
    parentId?: number;
    roots?: boolean;
    active?: boolean;
}

// ---- Pelota (balls/dto/ball-response.dto.ts) ----

export interface Ball {
    id: number;
    brand: string;
    model: string;
    size: string | null;
    active: boolean;
    // Partido al que está asignada; null = libre
    matchId: number | null;
}

export interface CreateBallPayload {
    brand: string;
    model: string;
    size?: string | null;
}

export interface UpdateBallPayload {
    brand?: string;
    model?: string;
    size?: string | null;
    active?: boolean;
}

export interface BallQuery {
    active?: boolean;
    // true = activas y sin partido asignado
    available?: boolean;
}

// ---- Torneo (tournaments/dto/tournament-response.dto.ts) ----

export interface TournamentSport {
    id: number;
    name: string;
}

export interface Tournament {
    id: number;
    name: string;
    sport: TournamentSport;
    // Fecha de día 'YYYY-MM-DD'
    startDate: string;
    // Fecha de día 'YYYY-MM-DD'
    endDate: string;
    // Fecha y hora ISO 8601
    registrationOpensAt: string;
    // Fecha y hora ISO 8601
    registrationClosesAt: string;
    status: TournamentStatus;
    active: boolean;
    // Inscripciones en estado ACTIVE
    registrationsCount: number;
    phasesCount: number;
}

export interface CreateTournamentPayload {
    name: string;
    sportId: number;
    // Fecha de día 'YYYY-MM-DD'
    startDate: string;
    // Fecha de día 'YYYY-MM-DD'
    endDate: string;
    // Fecha y hora ISO 8601 (toISOString())
    registrationOpensAt: string;
    // Fecha y hora ISO 8601 (toISOString())
    registrationClosesAt: string;
}

// Ningún campo acepta null (todas las columnas son NOT NULL)
export interface UpdateTournamentPayload {
    name?: string;
    sportId?: number;
    startDate?: string;
    endDate?: string;
    registrationOpensAt?: string;
    registrationClosesAt?: string;
    status?: TournamentStatus;
    active?: boolean;
}

export interface TournamentQuery {
    sportId?: number;
    status?: TournamentStatus;
    active?: boolean;
    // Texto parcial en el nombre
    search?: string;
}

// ---- Fases (phases/dto/*-response.dto.ts) ----

export interface PhaseTournament {
    id: number;
    name: string;
}

export interface GroupPhase {
    id: number;
    name: string;
    order: number;
    groupName: string;
    qualifiersCount: number | null;
    // Fecha de día 'YYYY-MM-DD'
    startDate: string | null;
    // Fecha de día 'YYYY-MM-DD'
    endDate: string | null;
    tournament: PhaseTournament;
    teamsCount: number;
    matchesCount: number;
}

// Equipo de un grupo (GET /group-phases/:id/teams)
export interface GroupTeam {
    id: number;
    name: string;
    city: string;
    modality: TeamModality;
}

export interface CreateGroupPhasePayload {
    tournamentId: number;
    name: string;
    order: number;
    // Se guarda en mayúsculas (ej. 'A')
    groupName: string;
    qualifiersCount?: number | null;
    startDate?: string | null;
    endDate?: string | null;
}

export interface UpdateGroupPhasePayload {
    name?: string;
    order?: number;
    groupName?: string;
    qualifiersCount?: number | null;
    startDate?: string | null;
    endDate?: string | null;
}

export interface GroupPhaseQuery {
    tournamentId?: number;
    order?: number;
}

export interface AssignGroupTeamPayload {
    teamId: number;
}

export interface FinalPhase {
    id: number;
    name: string;
    order: number;
    round: FinalRound;
    // Fecha de día 'YYYY-MM-DD'
    startDate: string | null;
    // Fecha de día 'YYYY-MM-DD'
    endDate: string | null;
    tournament: PhaseTournament;
    matchesCount: number;
}

export interface CreateFinalPhasePayload {
    tournamentId: number;
    name: string;
    order: number;
    round: FinalRound;
    startDate?: string | null;
    endDate?: string | null;
}

export interface UpdateFinalPhasePayload {
    name?: string;
    order?: number;
    round?: FinalRound;
    startDate?: string | null;
    endDate?: string | null;
}

export interface FinalPhaseQuery {
    tournamentId?: number;
}

// ---- Inscripción (registrations/dto/registration-response.dto.ts) ----

export interface RegistrationTournament {
    id: number;
    name: string;
}

export interface RegistrationTeam {
    id: number;
    name: string;
    city: string;
    modality: TeamModality;
}

export interface Registration {
    id: number;
    tournament: RegistrationTournament;
    team: RegistrationTeam;
    status: RegistrationStatus;
    // Fecha y hora ISO 8601
    registeredAt: string;
    // Fecha y hora ISO 8601
    withdrawnAt: string | null;
}

// Respuesta de POST /registrations (create-registrations-result.dto.ts)
export interface CreateRegistrationsResult {
    message: string;
    registrations: Registration[];
}

// Respuesta de PATCH /registrations/:id/withdraw
export interface WithdrawRegistrationResult {
    message: string;
    registration: Registration;
}

export interface CreateRegistrationPayload {
    tournamentId: number;
    // Uno o varios equipos (máx. 50, sin repetidos); todo o nada
    teamIds: number[];
}

export interface RegistrationQuery {
    tournamentId?: number;
    teamId?: number;
    status?: RegistrationStatus;
}
