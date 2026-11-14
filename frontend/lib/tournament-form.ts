import { ApiRequestError } from './api';
import { parseIsoDate, toIsoDate } from './dates';
import { ActionResult } from '@/types/action';
import { CreateTournamentPayload, Tournament, UpdateTournamentPayload } from '@/types/sports';

export interface TournamentFormValues {
    name: string;
    sportId: number | null;
    // Fechas de día (Calendar sin hora)
    startDate: Date | null;
    endDate: Date | null;
    // Fecha y hora (Calendar con hora)
    registrationOpensAt: Date | null;
    registrationClosesAt: Date | null;
    // Solo al editar
    active: boolean;
}

export type TournamentFormErrors = Partial<Record<keyof TournamentFormValues, string>>;

/** ActionResult que distingue los errores de validación por campo (400 del ValidationPipe). */
export interface TournamentActionResult extends ActionResult {
    validation?: boolean;
}

export const EMPTY_TOURNAMENT_FORM: TournamentFormValues = {
    name: '',
    sportId: null,
    startDate: null,
    endDate: null,
    registrationOpensAt: null,
    registrationClosesAt: null,
    active: true
};

/**
 * Mismas reglas que CreateTournamentDto y TournamentsService en ms-sports:
 * apertura < cierre, fecha del cierre <= inicio, inicio <= fin.
 */
export function validateTournamentForm(values: TournamentFormValues): TournamentFormErrors {
    const errors: TournamentFormErrors = {};
    const name = values.name.trim();

    if (!name) errors.name = 'El nombre es obligatorio';
    else if (name.length > 150) errors.name = 'El nombre no puede superar los 150 caracteres';

    if (values.sportId === null) errors.sportId = 'Selecciona un deporte';
    if (!values.startDate) errors.startDate = 'La fecha de inicio es obligatoria';
    if (!values.endDate) errors.endDate = 'La fecha de fin es obligatoria';
    if (!values.registrationOpensAt) errors.registrationOpensAt = 'La apertura de inscripciones es obligatoria';
    if (!values.registrationClosesAt) errors.registrationClosesAt = 'El cierre de inscripciones es obligatorio';

    const { startDate, endDate, registrationOpensAt, registrationClosesAt } = values;

    if (registrationOpensAt && registrationClosesAt && registrationOpensAt.getTime() >= registrationClosesAt.getTime()) {
        errors.registrationClosesAt = 'El cierre debe ser posterior a la apertura de inscripciones';
    }
    // Se compara el día del cierre (hora local) con el día de inicio, como el backend
    const closesDay = toIsoDate(registrationClosesAt);
    const startDay = toIsoDate(startDate);
    if (!errors.registrationClosesAt && closesDay && startDay && closesDay > startDay) {
        errors.registrationClosesAt = 'Las inscripciones deben cerrar el mismo día o antes del inicio del torneo';
    }
    const endDay = toIsoDate(endDate);
    if (startDay && endDay && startDay > endDay) {
        errors.endDate = 'La fecha de fin debe ser igual o posterior a la de inicio';
    }

    return errors;
}

export function hasErrors(errors: TournamentFormErrors): boolean {
    return Object.keys(errors).length > 0;
}

// Fechas de día con parseIsoDate (nunca new Date('YYYY-MM-DD')); fecha y hora con new Date(iso).
export function toFormValues(tournament: Tournament | null): TournamentFormValues {
    if (!tournament) return EMPTY_TOURNAMENT_FORM;
    return {
        name: tournament.name,
        sportId: tournament.sport.id,
        startDate: parseIsoDate(tournament.startDate),
        endDate: parseIsoDate(tournament.endDate),
        registrationOpensAt: new Date(tournament.registrationOpensAt),
        registrationClosesAt: new Date(tournament.registrationClosesAt),
        active: tournament.active
    };
}

// Se llama después de validar: los campos obligatorios ya tienen valor.
export function toCreatePayload(values: TournamentFormValues): CreateTournamentPayload {
    return {
        name: values.name.trim(),
        sportId: values.sportId ?? 0,
        startDate: toIsoDate(values.startDate) ?? '',
        endDate: toIsoDate(values.endDate) ?? '',
        registrationOpensAt: values.registrationOpensAt?.toISOString() ?? '',
        registrationClosesAt: values.registrationClosesAt?.toISOString() ?? ''
    };
}

// Solo envía lo que cambió respecto al torneo guardado.
export function toUpdatePayload(values: TournamentFormValues, original: Tournament): UpdateTournamentPayload {
    const next = toCreatePayload(values);
    const payload: UpdateTournamentPayload = {};

    if (next.name !== original.name) payload.name = next.name;
    if (next.sportId !== original.sport.id) payload.sportId = next.sportId;
    if (next.startDate !== original.startDate) payload.startDate = next.startDate;
    if (next.endDate !== original.endDate) payload.endDate = next.endDate;
    if (new Date(next.registrationOpensAt).getTime() !== new Date(original.registrationOpensAt).getTime()) {
        payload.registrationOpensAt = next.registrationOpensAt;
    }
    if (new Date(next.registrationClosesAt).getTime() !== new Date(original.registrationClosesAt).getTime()) {
        payload.registrationClosesAt = next.registrationClosesAt;
    }
    if (values.active !== original.active) payload.active = values.active;

    return payload;
}

/**
 * Un 400 sin errorCase viene del ValidationPipe de ms-sports ({ campo: mensaje }):
 * apiFetch une esos mensajes en `message`. Los 400 de reglas de negocio traen
 * errorCase INVALID_OPERATION.
 */
export function isValidationError(cause: unknown): boolean {
    return cause instanceof ApiRequestError && cause.status === 400 && cause.errorCase === 'HTTP_ERROR';
}
