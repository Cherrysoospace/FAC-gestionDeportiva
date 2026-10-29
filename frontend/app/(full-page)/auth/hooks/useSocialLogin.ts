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
            onError(cause instanceof ApiRequestError ? cause.message : `No se pudo continuar con ${PROVIDER_NAMES[provider]}`);
        } finally {
            setLoadingProvider(null);
        }
    };

    return { loadingProvider, signIn: (provider: SocialProvider) => void signIn(provider) };
}
