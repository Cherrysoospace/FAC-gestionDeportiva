import { clearSession, getStoredSession } from './session';

const API_URL = (
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8181'
).replace(/\/$/, '');

const PUBLIC_PATHS = new Set([
    '/api/auth/login',
    '/api/auth/oauth/firebase'
]);

export class ApiRequestError extends Error {
    readonly status: number;
    readonly errorCase: string;

    constructor(status: number, errorCase: string, message: string) {
        super(message);
        this.name = 'ApiRequestError';
        this.status = status;
        this.errorCase = errorCase;
    }
}

export interface ApiFetchOptions extends RequestInit {
    publicRequest?: boolean;
}

export function isPublicPath(path: string): boolean {
    return PUBLIC_PATHS.has(path.split('?')[0]);
}

export async function apiFetch<T>(
    path: string,
    options: ApiFetchOptions = {}
): Promise<T> {
    const {
        publicRequest = isPublicPath(path),
        headers: optionHeaders,
        ...requestOptions
    } = options;

    const headers = new Headers(optionHeaders);

    if (
        requestOptions.body &&
        !headers.has('Content-Type') &&
        !(
            typeof FormData !== 'undefined' &&
            requestOptions.body instanceof FormData
        )
    ) {
        headers.set('Content-Type', 'application/json');
    }

    if (!publicRequest) {
        const session = getStoredSession();
        if (session) {
            headers.set('Authorization', `Bearer ${session.token}`);
        }
    }

    let response: Response;

    try {
        response = await fetch(`${API_URL}${path}`, {
            ...requestOptions,
            headers
        });
    } catch {
        throw new ApiRequestError(
            0,
            'NETWORK_ERROR',
            'No se pudo conectar con el servidor'
        );
    }

    if (!response.ok) {
        let errorCase = 'HTTP_ERROR';
        let message = `Error ${response.status}`;

        try {
            const body = (await response.json()) as {
                errorCase?: string;
                message?: string;
            };

            if (body && typeof body === 'object') {
                errorCase = body.errorCase ?? errorCase;
                message = body.message ?? message;
            }
        } catch {
            // El backend pudo devolver una respuesta sin JSON.
        }

        const shouldCloseSession =
            response.status === 401 && !publicRequest;

        if (shouldCloseSession) {
            clearSession();

            if (
                typeof window !== 'undefined' &&
                window.location.pathname !== '/auth/login'
            ) {
                window.location.href = '/auth/login';
            }
        }

        throw new ApiRequestError(response.status, errorCase, message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return (await response.json()) as T;
}
