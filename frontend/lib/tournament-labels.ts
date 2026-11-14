import { TournamentStatus } from '@/types/sports';

export type TagSeverity = 'success' | 'info' | 'warning' | 'danger' | null;

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
    PLANNED: 'Planeado',
    REGISTRATION_OPEN: 'Inscripciones abiertas',
    IN_PROGRESS: 'En curso',
    FINISHED: 'Finalizado',
    CANCELLED: 'Cancelado'
};

// null = color principal del tema
export const TOURNAMENT_STATUS_SEVERITY: Record<TournamentStatus, TagSeverity> = {
    PLANNED: null,
    REGISTRATION_OPEN: 'info',
    IN_PROGRESS: 'warning',
    FINISHED: 'success',
    CANCELLED: 'danger'
};

export const TOURNAMENT_STATUSES: TournamentStatus[] = ['PLANNED', 'REGISTRATION_OPEN', 'IN_PROGRESS', 'FINISHED', 'CANCELLED'];

export const TOURNAMENT_STATUS_OPTIONS = TOURNAMENT_STATUSES.map((status) => ({ label: TOURNAMENT_STATUS_LABELS[status], value: status }));

// Mismas transiciones que TournamentsService en ms-sports: solo se avanza, y
// se puede cancelar desde cualquier estado salvo FINISHED.
const NEXT_STATUS: Record<TournamentStatus, TournamentStatus | null> = {
    PLANNED: 'REGISTRATION_OPEN',
    REGISTRATION_OPEN: 'IN_PROGRESS',
    IN_PROGRESS: 'FINISHED',
    FINISHED: null,
    CANCELLED: null
};

export function allowedTransitions(status: TournamentStatus): TournamentStatus[] {
    const next = NEXT_STATUS[status];
    const options: TournamentStatus[] = next ? [next] : [];
    if (status !== 'FINISHED' && status !== 'CANCELLED') options.push('CANCELLED');
    return options;
}

// Estados que no se pueden deshacer: piden confirmación.
export function requiresConfirmation(status: TournamentStatus): boolean {
    return status === 'FINISHED' || status === 'CANCELLED';
}

// En estos estados ya no se pueden cambiar nombre, deporte ni fechas.
export function isTournamentLocked(status: TournamentStatus): boolean {
    return status === 'IN_PROGRESS' || status === 'FINISHED' || status === 'CANCELLED';
}

// 'YYYY-MM-DD' → 'dd/mm/aaaa', sin pasar por Date (no se corre por la zona horaria).
export function formatDay(value: string | null): string {
    if (!value) return 'Sin fecha';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
}

// Fecha y hora ISO 8601 → 'dd/mm/aaaa hh:mm' en la hora local del navegador.
export function formatDateTime(value: string | null): string {
    if (!value) return 'Sin fecha';
    return new Date(value).toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}
