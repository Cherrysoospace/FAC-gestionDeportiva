import { describe, expect, it } from 'vitest';
import { allowedTransitions, formatDay, isTournamentLocked, requiresConfirmation } from './tournament-labels';

describe('allowedTransitions', () => {
    it('desde PLANNED solo abre inscripciones o cancela', () => {
        expect(allowedTransitions('PLANNED')).toEqual(['REGISTRATION_OPEN', 'CANCELLED']);
    });

    it('desde REGISTRATION_OPEN solo inicia o cancela', () => {
        expect(allowedTransitions('REGISTRATION_OPEN')).toEqual(['IN_PROGRESS', 'CANCELLED']);
    });

    it('desde IN_PROGRESS solo finaliza o cancela', () => {
        expect(allowedTransitions('IN_PROGRESS')).toEqual(['FINISHED', 'CANCELLED']);
    });

    it('FINISHED y CANCELLED no tienen transiciones', () => {
        expect(allowedTransitions('FINISHED')).toEqual([]);
        expect(allowedTransitions('CANCELLED')).toEqual([]);
    });
});

describe('reglas de estado', () => {
    it('pide confirmación solo para FINISHED y CANCELLED', () => {
        expect(requiresConfirmation('FINISHED')).toBe(true);
        expect(requiresConfirmation('CANCELLED')).toBe(true);
        expect(requiresConfirmation('IN_PROGRESS')).toBe(false);
    });

    it('bloquea nombre, deporte y fechas desde IN_PROGRESS', () => {
        expect(isTournamentLocked('PLANNED')).toBe(false);
        expect(isTournamentLocked('REGISTRATION_OPEN')).toBe(false);
        expect(isTournamentLocked('IN_PROGRESS')).toBe(true);
        expect(isTournamentLocked('FINISHED')).toBe(true);
        expect(isTournamentLocked('CANCELLED')).toBe(true);
    });
});

describe('formatDay', () => {
    it('convierte YYYY-MM-DD a dd/mm/aaaa sin correr el día', () => {
        expect(formatDay('2026-12-01')).toBe('01/12/2026');
        expect(formatDay(null)).toBe('Sin fecha');
    });
});
