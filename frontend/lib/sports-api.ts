import { apiFetch, ApiFetchOptions } from './api';

// Base del microservicio ms-sports (NestJS), sin '/' final.
export const SPORTS_API_URL = (process.env.NEXT_PUBLIC_SPORTS_API_URL ?? 'http://localhost:3001/gestion-deportiva').replace(/\/$/, '');

// Prefijo con el que se registran en ms_security los permisos de ms-sports.
export const SPORTS_PERMISSION_PREFIX = '/gestion-deportiva';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Llamada a ms-sports. Delega en apiFetch: el Bearer, el cierre de sesión en
 * 401, el evento 'fac:forbidden' en 403 y el parseo de errores son los mismos
 * que con ms_security.
 */
export function sportsApiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    return apiFetch<T>(path, { ...options, baseUrl: SPORTS_API_URL });
}

/**
 * Arma el query string de los filtros. Omite undefined, null y '' (filtro sin
 * valor); conserva false y 0. Devuelve '' si no queda ningún parámetro.
 */
export function toQueryString(params: QueryParams): string {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }
        search.append(key, String(value));
    });

    const query = search.toString();
    return query ? `?${query}` : '';
}
