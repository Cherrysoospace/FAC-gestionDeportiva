'use client';

import {
    Auth,
    AuthProvider as FirebaseAuthProvider,
    GithubAuthProvider,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import { apiFetch, ApiRequestError } from '@/lib/api';
import {
    hasEndpointRequirement,
    hasPermissionRequirement
} from '@/lib/access';
import { auth } from '@/lib/firebase';
import { fetchCurrentUser } from '@/lib/security-api';
import {
    clearSession,
    getStoredSession,
    saveSession
} from '@/lib/session';
import {
    CurrentUser,
    PermissionItem,
    PermissionOperation,
    RoleSummary
} from '@/types/security';

interface AuthResponseDTO {
    accessToken?: string;
    token?: string;
    expiresAt: string;
}

export type PermissionsStatus = 'idle' | 'loading' | 'ready' | 'error';

interface AuthContextValue {
    token: string | null;
    expiresAt: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    user: CurrentUser | null;
    permissions: PermissionItem[];
    roles: RoleSummary[];
    permissionsStatus: PermissionsStatus;
    hasPermission: (
        resource: string,
        operation: PermissionOperation
    ) => boolean;
    hasPermissionUrl: (url: string, method: string) => boolean;
    hasRole: (name: string) => boolean;
    refreshPermissions: () => Promise<void>;
    loginWithCredentials: (
        email: string,
        password: string,
        redirectTo?: string
    ) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    loginWithGoogle: (redirectTo?: string) => Promise<void>;
    loginWithGithub: (redirectTo?: string) => Promise<void>;
    loginWithDiscord: (
        code: string,
        redirectUri: string,
        redirectTo?: string
    ) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const lastForbiddenToast = useRef(0);
    const [token, setToken] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [permissionsStatus, setPermissionsStatus] =
        useState<PermissionsStatus>('idle');

    const loadCurrentUser = useCallback(async () => {
        setPermissionsStatus('loading');

        try {
            const currentUser = await fetchCurrentUser();
            setUser(currentUser);
            setPermissionsStatus('ready');
        } catch (cause) {
            if (cause instanceof ApiRequestError && cause.status === 401) {
                setUser(null);
                setToken(null);
                setExpiresAt(null);
                setPermissionsStatus('idle');
                return;
            }

            setPermissionsStatus('error');
        }
    }, []);

    useEffect(() => {
        const stored = getStoredSession();

        if (!stored) {
            setIsLoading(false);
            setPermissionsStatus('idle');
            return;
        }

        setToken(stored.token);
        setExpiresAt(stored.expiresAt);
        void loadCurrentUser().finally(() => setIsLoading(false));
    }, [loadCurrentUser]);

    useEffect(() => {
        if (!expiresAt) {
            return;
        }

        const remaining = new Date(expiresAt).getTime() - Date.now();

        if (remaining <= 0) {
            clearSession();
            setToken(null);
            setExpiresAt(null);
            setUser(null);
            setPermissionsStatus('idle');
            return;
        }

        const timeout = window.setTimeout(() => {
            clearSession();
            setToken(null);
            setExpiresAt(null);
            setUser(null);
            setPermissionsStatus('idle');
        }, remaining);

        return () => window.clearTimeout(timeout);
    }, [expiresAt]);

    useEffect(() => {
        const handleForbidden = () => {
            const now = Date.now();

            if (now - lastForbiddenToast.current > 2000) {
                lastForbiddenToast.current = now;
                toast.current?.show({
                    severity: 'error',
                    summary: 'Acceso denegado',
                    detail: 'No tienes permisos para realizar esta operación.',
                    life: 4000
                });
            }

            if (getStoredSession()) {
                void loadCurrentUser();
            }
        };

        window.addEventListener('fac:forbidden', handleForbidden);
        return () =>
            window.removeEventListener('fac:forbidden', handleForbidden);
    }, [loadCurrentUser]);

    // Pasos comunes a todos los métodos de login una vez que el backend
    // respondió: validar la respuesta, guardar la sesión y redirigir.
    const startSession = useCallback(
        async (data: AuthResponseDTO, redirectTo: string) => {
            const accessToken = data.accessToken ?? data.token;

            if (!accessToken || !data.expiresAt) {
                throw new ApiRequestError(
                    500,
                    'INVALID_RESPONSE',
                    'El servidor no devolvió una sesión válida'
                );
            }

            saveSession({ token: accessToken, expiresAt: data.expiresAt });
            setToken(accessToken);
            setExpiresAt(data.expiresAt);

            await loadCurrentUser();

            if (getStoredSession()) {
                router.push(redirectTo);
            }
        },
        [loadCurrentUser, router]
    );

    const loginWithFirebaseProvider = useCallback(
        async (provider: FirebaseAuthProvider, redirectTo = '/') => {
            if (!auth) {
                throw new ApiRequestError(
                    0,
                    'FIREBASE_NOT_CONFIGURED',
                    'El login social no está configurado'
                );
            }

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

                await startSession(data, redirectTo);
            } finally {
                await signOut(auth as Auth).catch(() => undefined);
            }
        },
        [startSession]
    );

    const loginWithGoogle = useCallback(
        (redirectTo = '/') =>
            loginWithFirebaseProvider(new GoogleAuthProvider(), redirectTo),
        [loginWithFirebaseProvider]
    );

    const loginWithGithub = useCallback(
        (redirectTo = '/') => {
            const provider = new GithubAuthProvider();
            // Sin este scope GitHub no entrega el correo si el usuario lo tiene privado
            provider.addScope('user:email');
            return loginWithFirebaseProvider(provider, redirectTo);
        },
        [loginWithFirebaseProvider]
    );

    const loginWithDiscord = useCallback(
        async (code: string, redirectUri: string, redirectTo = '/') => {
            const data = await apiFetch<AuthResponseDTO>(
                '/api/auth/oauth/discord',
                {
                    method: 'POST',
                    body: JSON.stringify({ code, redirectUri }),
                    publicRequest: true
                }
            );

            await startSession(data, redirectTo);
        },
        [startSession]
    );

    const loginWithCredentials = useCallback(
        async (email: string, password: string, redirectTo = '/') => {
            const data = await apiFetch<AuthResponseDTO>('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
                publicRequest: true
            });

            await startSession(data, redirectTo);
        },
        [startSession]
    );

    const register = useCallback(
        async (name: string, email: string, password: string) => {
            await apiFetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password }),
                publicRequest: true
            });
        },
        []
    );

    const logout = useCallback(async () => {
        const session = getStoredSession();

        if (session) {
            await apiFetch('/api/auth/logout', { method: 'POST' }).catch(
                () => undefined
            );
        }

        clearSession();
        setToken(null);
        setExpiresAt(null);
        setUser(null);
        setPermissionsStatus('idle');
        router.push('/auth/login');
    }, [router]);

    const refreshPermissions = useCallback(async () => {
        if (!getStoredSession()) {
            return;
        }

        await loadCurrentUser();
    }, [loadCurrentUser]);

    const hasPermission = useCallback(
        (resource: string, operation: PermissionOperation) =>
            hasPermissionRequirement(user?.permissions ?? [], {
                resource,
                operation
            }),
        [user]
    );

    const hasPermissionUrl = useCallback(
        (url: string, method: string) =>
            hasEndpointRequirement(user?.permissions ?? [], { url, method }),
        [user]
    );

    const hasRole = useCallback(
        (name: string) =>
            (user?.roles ?? []).some(
                (role) => role.name.toLowerCase() === name.toLowerCase()
            ),
        [user]
    );

    const value = useMemo<AuthContextValue>(() => {
        const authenticated =
            Boolean(token && expiresAt) &&
            new Date(expiresAt as string).getTime() > Date.now();

        return {
            token,
            expiresAt,
            isAuthenticated: authenticated,
            isLoading,
            user,
            permissions: user?.permissions ?? [],
            roles: user?.roles ?? [],
            permissionsStatus,
            hasPermission,
            hasPermissionUrl,
            hasRole,
            refreshPermissions,
            loginWithCredentials,
            register,
            loginWithGoogle,
            loginWithDiscord,
            loginWithGithub,
            logout
        };
    }, [
        token,
        expiresAt,
        isLoading,
        user,
        permissionsStatus,
        hasPermission,
        hasPermissionUrl,
        hasRole,
        refreshPermissions,
        loginWithCredentials,
        register,
        loginWithGoogle,
        loginWithDiscord,
        loginWithGithub,
        logout
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
            <Toast ref={toast} />
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
