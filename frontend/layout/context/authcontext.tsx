'use client';

import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { auth } from '@/lib/firebase';
import {
    clearSession,
    getStoredSession,
    saveSession
} from '@/lib/session';

interface AuthResponseDTO {
    accessToken?: string;
    token?: string;
    expiresAt: string;
}

interface AuthContextValue {
    token: string | null;
    expiresAt: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = getStoredSession();

        if (stored) {
            setToken(stored.token);
            setExpiresAt(stored.expiresAt);
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!expiresAt) {
            return;
        }

        const remaining = new Date(expiresAt).getTime() - Date.now();

        if (remaining <= 0) {
            clearSession();
            setToken(null);
            setExpiresAt(null);
            return;
        }

        const timeout = window.setTimeout(() => {
            clearSession();
            setToken(null);
            setExpiresAt(null);
        }, remaining);

        return () => window.clearTimeout(timeout);
    }, [expiresAt]);

    const loginWithGoogle = useCallback(async () => {
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();

            const data = await apiFetch<AuthResponseDTO>(
                '/api/auth/oauth/firebase',
                {
                    method: 'POST',
                    body: JSON.stringify({ idToken }),
                    publicRequest: true
                }
            );

            const accessToken = data.accessToken ?? data.token;

            if (!accessToken || !data.expiresAt) {
                throw new ApiRequestError(
                    500,
                    'INVALID_RESPONSE',
                    'El servidor no devolvió una sesión válida'
                );
            }

            saveSession({
                token: accessToken,
                expiresAt: data.expiresAt
            });
            setToken(accessToken);
            setExpiresAt(data.expiresAt);
            router.push('/');
        } finally {
            await signOut(auth).catch(() => undefined);
        }
    }, [router]);

    const logout = useCallback(async () => {
        // El backend actual no expone POST /api/auth/logout.
        clearSession();
        setToken(null);
        setExpiresAt(null);
        router.push('/auth/login');
    }, [router]);

    const value = useMemo<AuthContextValue>(() => {
        const authenticated =
            Boolean(token && expiresAt) &&
            new Date(expiresAt as string).getTime() > Date.now();

        return {
            token,
            expiresAt,
            isAuthenticated: authenticated,
            isLoading,
            loginWithGoogle,
            logout
        };
    }, [token, expiresAt, isLoading, loginWithGoogle, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }

    return context;
}
