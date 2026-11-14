import { describe, expect, it } from 'vitest';
import { ApiRequestError } from './api';
import { hasErrors, isValidationError, toCreatePayload, toFormValues, toUpdatePayload, TournamentFormValues, validateTournamentForm } from './tournament-form';
import { Tournament } from '@/types/sports';

const VALID: TournamentFormValues = {
    name: 'Copa Navidad',
    sportId: 1,
    startDate: new Date(2026, 11, 10),
    endDate: new Date(2026, 11, 20),
    registrationOpensAt: new Date(2026, 10, 15, 8, 0),
    registrationClosesAt: new Date(2026, 11, 5, 18, 0),
    active: true
};

const TOURNAMENT: Tournament = {
    id: 7,
    name: 'Copa Navidad',
    sport: { id: 1, name: 'Fútbol' },
    startDate: '2026-12-10',
    endDate: '2026-12-20',
    registrationOpensAt: new Date(2026, 10, 15, 8, 0).toISOString(),
    registrationClosesAt: new Date(2026, 11, 5, 18, 0).toISOString(),
    status: 'PLANNED',
    active: true,
    registrationsCount: 0,
    phasesCount: 0
};

describe('validateTournamentForm', () => {
    it('acepta un torneo con fechas válidas', () => {
        expect(hasErrors(validateTournamentForm(VALID))).toBe(false);
    });

    it('exige los campos obligatorios', () => {
        const errors = validateTournamentForm({ ...VALID, name: '  ', sportId: null, startDate: null });
        expect(errors.name).toBeDefined();
        expect(errors.sportId).toBeDefined();
        expect(errors.startDate).toBeDefined();
    });

    it('la apertura debe ser anterior al cierre', () => {
        const errors = validateTournamentForm({ ...VALID, registrationOpensAt: VALID.registrationClosesAt });
        expect(errors.registrationClosesAt).toBe('El cierre debe ser posterior a la apertura de inscripciones');
    });

    it('el cierre puede ser el mismo día del inicio, pero no después', () => {
        expect(validateTournamentForm({ ...VALID, registrationClosesAt: new Date(2026, 11, 10, 23, 0) }).registrationClosesAt).toBeUndefined();
        expect(validateTournamentForm({ ...VALID, registrationClosesAt: new Date(2026, 11, 11, 0, 30) }).registrationClosesAt).toBe('Las inscripciones deben cerrar el mismo día o antes del inicio del torneo');
    });

    it('el inicio debe ser igual o anterior al fin', () => {
        expect(validateTournamentForm({ ...VALID, endDate: VALID.startDate }).endDate).toBeUndefined();
        expect(validateTournamentForm({ ...VALID, endDate: new Date(2026, 11, 9) }).endDate).toBe('La fecha de fin debe ser igual o posterior a la de inicio');
    });
});

describe('conversión de fechas', () => {
    it('envía las fechas de día como YYYY-MM-DD y las de hora con toISOString', () => {
        const payload = toCreatePayload(VALID);
        expect(payload.startDate).toBe('2026-12-10');
        expect(payload.endDate).toBe('2026-12-20');
        expect(payload.registrationOpensAt).toBe(VALID.registrationOpensAt?.toISOString());
    });

    it('lee las fechas de día sin correrlas por la zona horaria', () => {
        const values = toFormValues(TOURNAMENT);
        expect(values.startDate?.getDate()).toBe(10);
        expect(values.startDate?.getMonth()).toBe(11);
    });

    it('al editar solo envía los campos que cambiaron', () => {
        expect(toUpdatePayload(toFormValues(TOURNAMENT), TOURNAMENT)).toEqual({});
        expect(toUpdatePayload({ ...toFormValues(TOURNAMENT), name: 'Copa Año Nuevo', active: false }, TOURNAMENT)).toEqual({ name: 'Copa Año Nuevo', active: false });
    });
});

describe('isValidationError', () => {
    it('solo trata como validación por campo el 400 sin errorCase', () => {
        expect(isValidationError(new ApiRequestError(400, 'HTTP_ERROR', 'El nombre es obligatorio'))).toBe(true);
        expect(isValidationError(new ApiRequestError(400, 'INVALID_OPERATION', 'No se puede pasar de PLANNED a FINISHED'))).toBe(false);
        expect(isValidationError(new ApiRequestError(409, 'ALREADY_EXISTS', 'Ya existe'))).toBe(false);
    });
});
