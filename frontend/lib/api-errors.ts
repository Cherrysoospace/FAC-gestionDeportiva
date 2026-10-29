import { ApiRequestError } from './api';

export function describeError(cause: unknown): string {
    if (cause instanceof ApiRequestError) {
        if (cause.status === 403) {
            return 'No tienes permisos para realizar esta operación.';
        }
        if (cause.status === 401) {
            return 'Tu sesión expiró. Inicia sesión nuevamente.';
        }
        if (cause.status === 0) {
            return 'No se pudo conectar con el servidor.';
        }
        return cause.message || 'Ocurrió un error inesperado.';
    }

    return 'Ocurrió un error inesperado.';
}
