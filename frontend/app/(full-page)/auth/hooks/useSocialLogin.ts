'use client';

import { useState } from 'react';
import { useAuth } from '@/layout/context/authcontext';
import { ApiRequestError } from '@/lib/api';
import { startDiscordAuth } from '@/lib/discord';

export type SocialProvider = 'google' | 'github' | 'discord';

const PROVIDER_NAMES: Record<SocialProvider, string> = {
    google: 'Google',
    github: 'GitHub',
    discord: 'Discord'
};

// Firebase permite una sola cuenta por correo: si ya entró con otro proveedor,
// bloquea este antes de llegar al backend (HU-SE-08, sin usuarios duplicados)
function describeFirebaseError(cause: unknown, providerName: string): string | null {
    const code = typeof cause === 'object' && cause !== null && 'code' in cause ? String(cause.code) : '';

    switch (code) {
        case 'auth/account-exists-with-different-credential':
            return 'Ese correo ya está registrado con otro método de acceso. Inicia sesión con el que usaste la primera vez.';
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return null;
        case 'auth/popup-blocked':
            return 'El navegador bloqueó la ventana de inicio de sesión. Permite las ventanas emergentes e inténtalo de nuevo.';
        default:
            return `No se pudo continuar con ${providerName}`;
    }
}

/**
 * Inicio de sesión con proveedores externos. También sirve para registrarse:
 * el backend crea la cuenta si no existe.
 */
export function useSocialLogin(nextPath: string, onError: (message: string | null) => void) {
    const { loginWithGoogle, loginWithGithub } = useAuth();
    const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);

    const signIn = async (provider: SocialProvider) => {
        onError(null);

        if (provider === 'discord') {
            // Redirige a Discord; el regreso lo procesa /auth/discord/callback
            onError(startDiscordAuth(nextPath));
            return;
        }

        setLoadingProvider(provider);
        try {
            await (provider === 'google' ? loginWithGoogle(nextPath) : loginWithGithub(nextPath));
        } catch (cause) {
            if (cause instanceof ApiRequestError) {
                onError(cause.message);
            } else {
                // Los errores de Firebase (popup, cuenta duplicada...) no traen mensaje del backend
                console.error(`[login ${provider}]`, cause);
                onError(describeFirebaseError(cause, PROVIDER_NAMES[provider]));
            }
        } finally {
            setLoadingProvider(null);
        }
    };

    return { loadingProvider, signIn: (provider: SocialProvider) => void signIn(provider) };
}
