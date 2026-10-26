export interface StoredSession {
    token: string;
    expiresAt: string;
}

const STORAGE_KEY = 'fac.security.session';

export function getStoredSession(): StoredSession | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as Partial<StoredSession>;
        const expiration = parsed.expiresAt
            ? new Date(parsed.expiresAt).getTime()
            : Number.NaN;

        if (
            typeof parsed.token !== 'string' ||
            !parsed.token ||
            !Number.isFinite(expiration) ||
            expiration <= Date.now()
        ) {
            clearSession();
            return null;
        }

        return {
            token: parsed.token,
            expiresAt: parsed.expiresAt as string
        };
    } catch {
        clearSession();
        return null;
    }
}

export function saveSession(session: StoredSession): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
        // localStorage puede estar deshabilitado; la sesión no se persiste.
    }
}

export function clearSession(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Nada que limpiar si localStorage no está disponible.
    }
}
