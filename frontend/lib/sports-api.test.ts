import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./session', () => ({
    getStoredSession: () => ({ token: 'token-de-prueba' }),
    clearSession: vi.fn()
}));

import { sportsApiFetch, toQueryString } from './sports-api';

describe('toQueryString', () => {
    it('omite los valores undefined', () => {
        expect(toQueryString({ tournamentId: 1, status: undefined })).toBe('?tournamentId=1');
    });

    it("omite '' y conserva false", () => {
        expect(toQueryString({ search: '', active: false })).toBe('?active=false');
    });

    it("devuelve '' cuando no hay parámetros", () => {
        expect(toQueryString({})).toBe('');
    });

    it('omite null y conserva 0', () => {
        expect(toQueryString({ parentId: null, order: 0 })).toBe('?order=0');
    });
});

describe('sportsApiFetch', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('llama a ms-sports con el prefijo /gestion-deportiva y el token', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        vi.stubGlobal('fetch', fetchMock);

        await sportsApiFetch('/tournaments?status=PLANNED');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe('http://localhost:3001/gestion-deportiva/tournaments?status=PLANNED');
        expect(new Headers(init.headers).get('Authorization')).toBe('Bearer token-de-prueba');
        expect(init).not.toHaveProperty('baseUrl');
    });
});
